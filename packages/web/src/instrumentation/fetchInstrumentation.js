import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';

const api = require('@opentelemetry/api');
const core = require('@opentelemetry/core');
const semantic_conventions_1 = require('@opentelemetry/semantic-conventions');

class EpsagonFetchInstrumentation extends FetchInstrumentation {
  constructor(parentSpan, options) {
    super();
    this.epsParentSpan = parentSpan;
    this.globalOptions = options;
  }

  // has to be overridden in order to grab response obj before the stream is read and no longer useable
  _patchConstructor() {
    return (original) => {
      const plugin = this;
      return function patchConstructor(input, init) {
        const url = input instanceof Request ? input.url : input;
        const options = input instanceof Request ? input : init || {};
        const createdSpan = plugin._createSpan(url, options, this.globalOptions);
        if (!createdSpan) {
          return original.apply(this, [url, options]);
        }
        const spanData = plugin._prepareSpanData(url);
        function endSpanOnError(span, error) {
          plugin._applyAttributesAfterFetch(span, options, error);
          plugin._endSpan(span, spanData, {
            status: error.status || 0,
            statusText: error.message,
            url,
          });
        }
        function endSpanOnSuccess(span, response) {
          plugin._applyAttributesAfterFetch(span, options, response);
          if (response.status >= 200 && response.status < 400) {
            plugin._endSpan(span, spanData, response);
          } else {
            plugin._endSpan(span, spanData, {
              status: response.status,
              statusText: response.statusText,
              url,
            });
          }
        }
        function onSuccess(span, resolve, response) {
          try {
            const resClone = response.clone();
            const resClone2 = response.clone();
            const { body } = resClone;
            if (body) {
              const reader = body.getReader();
              const read = () => {
                reader.read().then(async ({ done }) => {
                  if (done) {
                    const resHeaders = [];
                    for (const entry of resClone2.headers.entries()) {
                      if (entry[0] === 'content-length') {
                        span.setAttribute('http.response_content_length_eps', parseInt(entry[1]));
                      }
                      resHeaders.push(entry);
                    }
                    span.setAttribute('http.response.body', (await resClone2.text()).substring(0, 5000));
                    if (resHeaders.length > 0) {
                      span.setAttribute('http.response.headers', JSON.stringify(resHeaders));
                    }
                    endSpanOnSuccess(span, response);
                  } else {
                    read();
                  }
                }, (error) => {
                  endSpanOnError(span, error);
                });
              };
              read();
            } else {
              // some older browsers don't have .body implemented
              endSpanOnSuccess(span, response);
            }
          } finally {
            resolve(response);
          }
        }
        function onError(span, reject, error) {
          try {
            endSpanOnError(span, error);
          } finally {
            reject(error);
          }
        }
        return new Promise((resolve, reject) => api.context.with(api.trace.setSpan(api.context.active(), createdSpan), () => {
          plugin._addHeaders(options, url);
          plugin._tasksCount++;
          return original
            .apply(this, [url, options])
            .then(onSuccess.bind(this, createdSpan, resolve), onError.bind(this, createdSpan, reject));
        }));
      };
    };
  }

  // create span copied over so parent span can be added at creation, additional attributes also added here
  _createSpan(url, options = {}, globalOptions) {
    if (core.isUrlIgnored(url, this._getConfig().ignoreUrls)) {
      api.diag.debug('ignoring span as url matches ignored url');
      return;
    }
    const method = (options.method || 'GET').toUpperCase();
    const spanName = `HTTP ${method}`;

    let span;
    if (globalOptions.metadataOnly) {
      span = {
        kind: api.SpanKind.CLIENT,
        attributes: {
          component: this.moduleName,
          [semantic_conventions_1.SemanticAttributes.HTTP_METHOD]: method,
          [semantic_conventions_1.SemanticAttributes.HTTP_URL]: url,
        },
      }
    }
    else {
      span = {
        kind: api.SpanKind.CLIENT,
        attributes: {
          component: this.moduleName,
          [semantic_conventions_1.SemanticAttributes.HTTP_METHOD]: method,
          [semantic_conventions_1.SemanticAttributes.HTTP_URL]: url,
          'http.request.headers': JSON.stringify(options.headers),
          'http.request.body': options.body,
        },
      }
    }
    return this.tracer.startSpan(spanName, span, this.epsParentSpan.currentSpan ? api.trace.setSpan(api.context.active(), this.epsParentSpan.currentSpan) : undefined);
  }
}

export default EpsagonFetchInstrumentation;
