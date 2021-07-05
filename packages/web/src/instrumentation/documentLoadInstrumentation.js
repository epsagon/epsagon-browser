import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';

const api = require('@opentelemetry/api');

class EpsagonDocumentLoadInstrumentation extends DocumentLoadInstrumentation {
  constructor(parentSpan) {
    super();
    this.epsParentSpan = parentSpan;
  }

  addEpsSpanAttrs(span) {
    if(this.epsParentSpan.identifyFields){
      const { userId, userName, userEmail, companyId, companyName } = this.epsParentSpan.identifyFields;
      if (userId) span.setAttribute('user.id', this.epsParentSpan.identifyFields.userId);
      if (userName) span.setAttribute('user.name', this.epsParentSpan.identifyFields.name);
      if (userEmail) span.setAttribute('user.email', this.epsParentSpan.identifyFields.email);
      if (companyId) span.setAttribute('company.id', this.epsParentSpan.identifyFields.companyId);
      if (companyName) span.setAttribute('company.name', this.epsParentSpan.identifyFields.companyName);
    }
    if(this.epsParentSpan.tags){
        for(let key in this.epsParentSpan.tags){
            span.setAttribute(key, this.epsParentSpan.tags[key])
        }
    }
  }

  _onDocumentLoaded(event = false) {
    // Timeout is needed as load event doesn't have yet the performance metrics for loadEnd.
    // Support for event "loadend" is very limited and cannot be used
    window.setTimeout(() => {
      if (event.error || event.reason) {
        this.reportError(event);
      } else {
        this._collectPerformance();
      }
    });
  }

  _startSpan(spanName, performanceName, entries, parentSpan) {
    // drop document fetch events
    if (spanName == 'documentFetch') {
      return undefined;
    }
    const initialSpan = super._startSpan(spanName, performanceName, entries, this.epsParentSpan.currentSpan);
    if (initialSpan && !this.epsParentSpan.currentSpan) {
      this.epsParentSpan.currentSpan = initialSpan;
    }
    this.addEpsSpanAttrs(initialSpan);
    return initialSpan;
  }

  // drop resource fetch spans
  _initResourceSpan(resource, parentSpan) {
  }

  _includes(obj, str) {
    if (!obj) {
        return false;
    }
    if (typeof obj === 'string' || obj instanceof Array) {
        return obj.indexOf(str) !== -1    
    }
    return false;
  }

  reportError(event) {
    let error;
    event.error ? error = event.error : error = event.reason;
    if(error && (this._includes(error.message, 'Failed to export with XHR (status: 502)')) || this._includes(error, 'Failed to export with XHR (status: 502)')){
      return;
    }
    const span = this.tracer.startSpan('error', {
      attributes: {
        message: error.message || error,
        type: 'browser',
        operation: 'page_load',
        // "stack": stack
      },
    }, this.epsParentSpan.currentSpan ? api.trace.setSpan(api.context.active(), this.epsParentSpan.currentSpan) : undefined);
    this.addEpsSpanAttrs(span);
    span.setStatus({ code: 2 });
    span.end();
  }

  _waitForPageLoad() {
    if (window.document.readyState === 'complete') {
      this._onDocumentLoaded();
    } else {
      this._onDocumentLoaded = this._onDocumentLoaded.bind(this);
      window.addEventListener('load', this._onDocumentLoaded);
      window.addEventListener('error', this._onDocumentLoaded);
      window.addEventListener('unhandledrejection', this._onDocumentLoaded);
      window.addEventListener('rejectionhandled', this._onDocumentLoaded);
    }
  }

  enable() {
    // remove previously attached load to avoid adding the same event twice
    // in case of multiple enable calling.
    window.removeEventListener('load', this._onDocumentLoaded);
    window.removeEventListener('error', this._onDocumentLoaded);
    window.removeEventListener('unhandledrejection', this._onDocumentLoaded);
    window.removeEventListener('rejectionhandled', this._onDocumentLoaded);
    this._waitForPageLoad();
  }

  /**
     * implements disable function
     */
  disable() {
    super.disable();
    window.removeEventListener('error', this._onDocumentLoaded);
    window.removeEventListener('unhandledrejection', this._onDocumentLoaded);
    window.removeEventListener('rejectionhandled', this._onDocumentLoaded);
  }
}

export default EpsagonDocumentLoadInstrumentation;
