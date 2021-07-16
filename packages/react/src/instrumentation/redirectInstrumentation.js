/* eslint max-len: ["error", { "ignoreComments": true }] */

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["parentSpan"] }] */
const EpsagonUtils = require('@epsagon/web').EpsagonUtils;

  
function ReactRedirectInstrumentation(history, tracer, parentSpan) {
  
    const startSpan = (originPath, newPath) => {
      return tracer.startSpan('route_change', {
        attributes: {
          operation: 'route_change',
          type: 'browser',
          previousPage: originPath,
          path: newPath,
        },
      });
    };
  
    history.listen((location, action) => {
      let currentPath = `${location.pathname}${window.location.hash}`
      if (action && (action.toLowerCase() === 'push' || action.toLowerCase() === 'pop') && (parentSpan.path != currentPath)) {
          let span = startSpan(parentSpan.path, location.pathname)
          parentSpan.currentSpan = span;
          if(location.hash && location.hash.length){span.setAttribute('hash', location.hash)};
          if(location.search && location.search.length){span.setAttribute('search', location.search)};
          if(location.state && location.state.length){span.setAttribute('history.state', location.state)};
          span.setAttribute('action', action);
          span.setStatus({ code: 0 });
          EpsagonUtils.addEpsSpanAttrs(span, parentSpan);
          span.end();
          parentSpan.path = currentPath;
        }
      
    });
  }
  
export default ReactRedirectInstrumentation;
