/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';

const api = require('@opentelemetry/api');
const core1 = require('@opentelemetry/core');
const semanticConventions1 = require('@opentelemetry/semantic-conventions');

class EpsagonXMLHttpRequestInstrumentation extends XMLHttpRequestInstrumentation {
  constructor(config, parentSpan, options) {
    super(config);
    this.epsParentSpan = parentSpan;
    this.globalOptions = options;
  }

  // create span copied over so parent span can be added at creation
  _createSpan(xhr, url, method) {
    if (core1.isUrlIgnored(url, this._getConfig().ignoreUrls)) {
      api.diag.debug('ignoring span as url matches ignored url');
      return;
    }
    const spanName = `HTTP ${method.toUpperCase()}`;
    const currentSpan = this.tracer.startSpan(spanName, {
      kind: api.SpanKind.CLIENT,
      attributes: {
        [semanticConventions1.SemanticAttributes.HTTP_METHOD]: method,
        [semanticConventions1.SemanticAttributes.HTTP_URL]: url,
      },
    }, this.epsParentSpan.currentSpan ? api.trace.setSpan(api.context.active(), this.epsParentSpan.currentSpan) : undefined);
    currentSpan.addEvent('open');
    this._cleanPreviousSpanInformation(xhr);
    this._xhrMem.set(xhr, {
      span: currentSpan,
      spanUrl: url,
    });
    return currentSpan;
  }

  _addFinalSpanAttributes(span, xhrMem, spanUrl) {
    super._addFinalSpanAttributes(span, xhrMem, spanUrl);
    let responseBody = xhrMem.xhrInstance.response;

    if (typeof spanUrl === 'string' && !this.globalOptions.metadataOnly) {
      responseBody = typeof responseBody !== 'string' ? JSON.stringify(responseBody) : responseBody;
      span.setAttribute('http.response.body', responseBody.substring(0, 5000));
      const resHeadersArr = xhrMem.xhrInstance.getAllResponseHeaders().split('\r\n');
      if (resHeadersArr.length > 0) {
        const headersObj = resHeadersArr.reduce((acc, current, i) => {
          const parts = current.split(': ');
          acc[parts[0]] = parts[1];
          return acc;
        }, {});
        span.setAttribute('http.response.headers', `${JSON.stringify(headersObj)}`);
      }
      span.setAttribute('http.response_content_length', xhrMem.xhrInstance.getResponseHeader('content-length'));
      span.setAttribute('http.request.body', xhrMem.xhrInstance.__zone_symbol__xhrTask.data.args[0]);
    }
  }

  // adds xhr to the xhr mem so we can parse response in final span attributes
  _addResourceObserver(xhr, spanUrl) {
    super._addResourceObserver(xhr, spanUrl);
    const xhrMem = this._xhrMem.get(xhr);
    if (!xhrMem) {
      return;
    }
    xhrMem.xhrInstance = xhr;
  }
}

export default EpsagonXMLHttpRequestInstrumentation;
