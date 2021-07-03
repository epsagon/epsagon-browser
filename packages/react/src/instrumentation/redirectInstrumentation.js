/* eslint max-len: ["error", { "ignoreComments": true }] */

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["parentSpan"] }] */

function addEpsSpanAttrs(span, parentSpan) {
  if(parentSpan.identifyFields){
      span.setAttribute('userId', parentSpan.identifyFields.userId);
      span.setAttribute('name', parentSpan.identifyFields.name);
      span.setAttribute('email', parentSpan.identifyFields.email);
      span.setAttribute('companyId', parentSpan.identifyFields.companyId);
      span.setAttribute('companyName', parentSpan.identifyFields.companyName);
  }
  if(parentSpan.tags){
      for(let key in parentSpan.tags){
          span.setAttribute(key, parentSpan.tags[key]);
      }
  }
}

function ReactRedirectInstrumentation(history, tracer, parentSpan) {
  const getInitPathName = () => {
    if (history && history.location) {
      return history.location.pathname;
    }

    return undefined;
  };

  let span;
  const startSpan = (originPath) => {
    span = tracer.startSpan('route_change', {
      attributes: {
        operation: 'route_change',
        type: 'browser',
        previousPage: originPath,
      },
    });
  };

  const initPathName = getInitPathName();
  startSpan(initPathName);

  history.listen((location, action) => {
    if (action && (action.toLowerCase() === 'push' || action.toLowerCase() === 'pop')) {
      if (span) {
        parentSpan.currentSpan = span;
        span.setAttribute('path', location.pathname);
        span.setAttribute('hash', location.hash);
        span.setAttribute('search', location.search);
        span.setAttribute('history.state', location.state);
        span.setAttribute('action', action);
        span.setStatus({ code: 0 });
        addEpsSpanAttrs(span, parentSpan);
        span.end();
        startSpan(location.pathname);
      }
    }
  });
}

export default ReactRedirectInstrumentation;
