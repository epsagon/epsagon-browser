import EpsagonUtils from '../utils';

/* eslint-disable no-undef */
class EpsagonRedirectInstrumentation {
  constructor(tracer, parentSpan, resetTimer) {
    this.parentSpan = parentSpan;
    this.parentSpan.path = `${window.location.pathname}${window.location.hash}`;
    this.tracer = tracer;
    setInterval(() => {
      const currentPath = `${window.location.pathname}${window.location.hash}`;
      if (this.parentSpan.path && currentPath !== parentSpan.path) {
        this.createRouteChangeSpan(this.parentSpan.path, currentPath);
        this.parentSpan.path = currentPath;
      }
    }, resetTimer);
  }

  createRouteChangeSpan(oldPath, newPath) {
    const span = this.tracer.startSpan('route_change', {
      attributes: {
        operation: 'route_change',
        type: 'browser',
        previousPage: oldPath,
        path: newPath,
        'http.url': window.location.href,
      },
    });
    this.parentSpan.currentSpan = span;
    if (window.location.hash) {
      span.setAttribute('hash', window.location.hash);
    }
    EpsagonUtils.addEpsSpanAttrs(span, this.parentSpan);
    span.setStatus({ code: 0 });
    span.end();
  }
}

export default EpsagonRedirectInstrumentation;
