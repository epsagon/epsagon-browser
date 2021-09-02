/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
import { ROOT_CONTEXT } from '@opentelemetry/api';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import EpsagonUtils from '../utils';
import { diag } from "@opentelemetry/api";

const api = require('@opentelemetry/api');

class EpsagonDocumentLoadInstrumentation extends DocumentLoadInstrumentation {
  constructor(parentSpan) {
    super();
    this.epsParentSpan = parentSpan;
  }

  _onDocumentLoaded(event = false) {
    // Timeout is needed as load event doesn't have yet the performance metrics for loadEnd.
    // Support for event "loadend" is very limited and cannot be used
    /* eslint-disable no-undef */
    window.setTimeout(() => {
      if (event.error || event.reason) {
        this.reportError(event);
      } else {
        this._collectPerformance();
      }
    });
  }

  _startSpan(spanName, performanceName, entries) {
    diag.debug('start span with name: ', spanName);
    // drop document fetch events
    if (spanName === 'documentFetch') {      
      return undefined;
    }
    const initialSpan = super._startSpan(spanName, performanceName, entries, this.epsParentSpan.currentSpan);    
    if (initialSpan && !this.epsParentSpan.currentSpan) {
      this.epsParentSpan.currentSpan = initialSpan;
    }
    EpsagonUtils.addEpsSpanAttrs(initialSpan, this.epsParentSpan);
    diag.debug('initialSpan: ', initialSpan);
    return initialSpan;
  }

  // drop resource fetch spans
  /* eslint-disable class-methods-use-this */
  _initResourceSpan() {
  }

  /* eslint-disable class-methods-use-this */
  _includes(obj, str) {
    if (!obj) {
      return false;
    }
    if (typeof obj === 'string' || obj instanceof Array) {
      return obj.indexOf(str) !== -1;
    }
    return false;
  }

  reportError(event) {
    diag.debug('DocumentLoadInstrumentation: reportError');
    const error = event.error ? event.error : event.reason;
    const failedToExportError = (this._includes(error.message, 'Failed to export with XHR (status: 502)')) || this._includes(error, 'Failed to export with XHR (status: 502)');
    if (error && failedToExportError) {
      return;
    }
    const span = this.tracer.startSpan('error', {
      attributes: {
        message: error.message || error,
        type: 'browser',
        operation: 'page_load',
      },
    }, this.epsParentSpan.currentSpan ? api.trace.setSpan(api.context.active(), this.epsParentSpan.currentSpan) : undefined);
    span.exceptionData = {
      name: 'exception',
      attributes: EpsagonUtils.genErrorAttribution(error),
    };
    EpsagonUtils.addEpsSpanAttrs(span, this.epsParentSpan);
    span.setStatus({ code: 2 });
    diag.debug('error span: ', span);
    span.end();    
  }

  /* eslint-disable no-undef */
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

  /* eslint-disable no-undef */
  enable() {
    // remove previously attached load to avoid adding the same event twice
    // in case of multiple enable calling.
    window.removeEventListener('load', this._onDocumentLoaded);
    window.removeEventListener('error', this._onDocumentLoaded);
    window.removeEventListener('unhandledrejection', this._onDocumentLoaded);
    window.removeEventListener('rejectionhandled', this._onDocumentLoaded);
    this._waitForPageLoad();
  }

  /* eslint-disable no-undef */
  disable() {
    super.disable();
    window.removeEventListener('error', this._onDocumentLoaded);
    window.removeEventListener('unhandledrejection', this._onDocumentLoaded);
    window.removeEventListener('rejectionhandled', this._onDocumentLoaded);
  }
}

export default EpsagonDocumentLoadInstrumentation;
