/* eslint-disable no-console */
/* eslint-disable max-len */
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';
import { diag } from "@opentelemetry/api";
import EpsagonFormatter from './formatter';
import EpsagonResourceManager from './resource-manager';
import EpsagonIPCalculator from './ip-calculator';
import EpsagonUtils from './utils';

const rootType = {
  EPS: 'epsagon_init',
  DOC: 'document_load',
  REDIR: 'redirect',
  ROOT_TYPE_DOC: 'doc',
  ERROR: 'error',
  EXCEPTION: 'exception',
};

const spanAttributeNames = {
  BROWSER_HOST: 'browser.host',
  BROWSER_PATH: 'browser.path',
  HOST_HEADER: 'http.host',
  HOST_USER_AGENT: 'http.user_agent',
  HOST_REQUEST_USER_AGENT: 'http.request.headers.User-Agent',
  DOCUMENT_LOAD: 'document-load',
  DOCUMENT_LOAD_SPAN_NAME: 'documentLoad',
  REACT_COMPONENT_NAME: 'react_component_name',
  USER_INTERACTION: 'user-interaction',
  ROUTE_CHANGE: 'route_change',
  RESPONSE_CONTENT_LENGTH: 'http.response_content_length',
  RESPONSE_CONTENT_LENGTH_EPS: 'http.response_content_length_eps',
  EXCEPTION_MESSAGE: 'exception.message',
  EXCEPTION_TYPE: 'exception.type',
  EXCEPTION_STACK: 'exception.stacktrace',
  MESSAGE: 'message',
};

class EpsagonExporter extends CollectorTraceExporter {
  constructor(config, ua) {
    super(config);
    this.config = config;
    this.userAgent = ua;
    this.formatter = new EpsagonFormatter(config);
    this.resourceManager = new EpsagonResourceManager(config);
    EpsagonIPCalculator.calculate((data) => {
      this.userAgent.browser.ip = data.ip;
      this.userAgent.browser.country = data.country;
      this.userAgent.browser.regionName = data.regionName;
      this.userAgent.browser.city = data.city;
    });
  }

  convert(spans) {
    const errorSpans = spans.filter((s) => s.exceptionData);
    try {
      const convertedSpans = super.convert(spans);
      let spansList = EpsagonUtils.getFirstResourceSpan(convertedSpans).instrumentationLibrarySpans;
      const rootSpan = {
        rootType: rootType.EPS,
        eps: {},
        doc: {},
        redirect: {},
      };
      const errSpan = {
        messages: [],
      };

      Object.keys(spansList).forEach((spanIndex) => {
        const spanSubList = spansList[spanIndex].spans;

        /* eslint-disable no-restricted-syntax */
        for (const spanSubIndex in spanSubList) {
          if (spanSubList[spanSubIndex]) {
            let span = spanSubList[spanSubIndex];
            let spanAttributes = span.attributes;
            let attributesLength = spanAttributes.length;

            if (span.name === rootType.EPS) {
              rootSpan.eps.position = spanIndex;
              rootSpan.eps.subPosition = spanSubIndex;
              rootSpan.eps.spanId = span.spanId;
              const formattedSpan = EpsagonFormatter.formatDocumentLoadSpan();
              span.name = formattedSpan.name;
              spanAttributes[attributesLength] = formattedSpan.browser;
              attributesLength += 1;
              spanAttributes[attributesLength] = formattedSpan.operation;
              attributesLength += 1;
            }
            if (span.name === rootType.ERROR) {
              if (span.attributes && span.attributes.length) {
                rootSpan.doc.position = spanIndex;
                errSpan.messages.push(EpsagonUtils.getFirstAttribute(span).value.stringValue);
              }
              break;
            }

            const httpHost = spanAttributes.filter((attr) => attr.key === spanAttributeNames.HOST_HEADER);
            const userInteraction = spanAttributes.filter((attr) => attr.value.stringValue === spanAttributeNames.USER_INTERACTION);
            const documentLoad = spanAttributes.filter((attr) => attr.value.stringValue === spanAttributeNames.DOCUMENT_LOAD);
            const reactUpdates = spanAttributes.filter((attr) => attr.key === spanAttributeNames.REACT_COMPONENT_NAME);

            if (httpHost.length > 0) {
              const formattedHttpRequestSpan = this.formatter.formatHttpRequestSpan(span, httpHost, spanAttributes, attributesLength);
              spanAttributes = formattedHttpRequestSpan.spanAttributes;
              attributesLength = formattedHttpRequestSpan.attributesLength;
              span = formattedHttpRequestSpan.span;
            } else if (userInteraction.length > 0) {
              const formattedSpan = EpsagonFormatter.formatUserInteractionSpan(spanAttributes, attributesLength);
              spanAttributes[attributesLength] = formattedSpan.userInteraction;
              attributesLength += 1;
              spanAttributes[attributesLength] = formattedSpan.operation;
              attributesLength += 1;
            } else if (documentLoad.length > 0 || reactUpdates.length > 0) {
              rootSpan.doc.position = spanIndex;

              // replace root span with document load
              if (span.name === spanAttributeNames.DOCUMENT_LOAD_SPAN_NAME) {
                rootSpan.rootType = rootType.DOC;
                rootSpan.eps.remove = true;
                rootSpan.doc.subPosition = spanSubIndex;
                rootSpan.doc.parent = span.parentSpanId;
              }

              const formattedSpan = EpsagonFormatter.formatDocumentLoadSpan();
              span.name = formattedSpan.name;
              spanAttributes[attributesLength] = formattedSpan.browser;
              attributesLength += 1;
              spanAttributes[attributesLength] = formattedSpan.operation;
              attributesLength += 1;
            } else if (span.name === spanAttributeNames.ROUTE_CHANGE) {
              rootSpan.rootType = rootType.REDIR;

              const formattedSpan = EpsagonFormatter.formatRouteChangeSpan(this.userAgent);
              span.name = formattedSpan.name;
              spanAttributes[attributesLength] = formattedSpan.obj;
              attributesLength += 1;

              rootSpan.redirect.position = spanIndex;
              rootSpan.redirect.subPosition = spanSubIndex;
            }

            const finalAttrs = this.addFinalGenericSpanAttrs(spanAttributes, attributesLength, span);
            attributesLength = finalAttrs.attributesLength;
            span = finalAttrs.span;
            spanAttributes = finalAttrs.spanAttributes;
          }
        }
      });

      if (errorSpans && errorSpans.length > 0) {
        spansList = EpsagonExporter.handleErrors(errorSpans, spansList, rootSpan);
      }

      if (rootSpan.eps.remove && rootSpan.doc.parent === rootSpan.eps.spanId) {
        const docLoad = spansList[rootSpan.doc.position].spans[0];
        docLoad.parentSpanId = undefined;
        docLoad.spanId = rootSpan.eps.spanId;
        spansList.splice(rootSpan.eps.position, 1);
      }

      return this.resourceManager.addResourceAttrs(convertedSpans, this.userAgent);
    } catch (err) {
      diag.warn('error converting and exporting', err);
      return null;
    }
  }

  static handleErrors(errSpan, _spansList, rootSpan) {
    const spansList = _spansList;
    if (rootSpan.rootType === rootType.REDIR || rootSpan.rootType === rootType.DOC) {
      const type = rootSpan.rootType === rootType.REDIR ? rootType.REDIR : rootType.ROOT_TYPE_DOC;
      const rootSubList = spansList[rootSpan[type].position].spans;
      const rootSubPos = rootSpan[type].subPosition;

      // errors get converted from their own spans to an event on the root span
      Array.from(errSpan.values()).forEach((err) => {
        rootSubList[rootSubPos].events.unshift({
          name: rootType.EXCEPTION,
          attributes: err.exceptionData.attributes,
        });
      });
      rootSubList[rootSpan[type].subPosition].status.code = 2;
      spansList[rootSpan.doc.position].spans = spansList[rootSpan.doc.position].spans.filter((span) => span.name !== rootType.ERROR);
    } else {
      /// remove duplicate events and add attrs
      const finalSpans = [];
      spansList[rootSpan.doc.position].spans.forEach((span) => {
        if (span.name === rootType.ERROR) {
          const errorData = errSpan.filter((s) => s.traceID === span.traceID);
          const errorDataSpan = errorData && errorData.length ? errorData[0] : errorData;
          /* eslint-disable no-undef */
          // eslint-disable-next-line no-param-reassign
          span.name = `${window.location.pathname}${window.location.hash}`;
          span.events.unshift({
            name: rootType.EXCEPTION,
            attributes: errorDataSpan.exceptionData.attributes,
          });
          finalSpans.push(span);
        }
      });
      spansList[rootSpan.doc.position].spans = finalSpans;
    }
    return spansList;
  }

  addFinalGenericSpanAttrs(_spanAttributes, _attributesLength, _span) {
    const spanAttributes = _spanAttributes;
    const span = _span;
    let attributesLength = _attributesLength;
    // replace any user agent keys with eps name convention
    const httpUA = spanAttributes.filter((attr) => attr.key === spanAttributeNames.HOST_USER_AGENT);
    if (httpUA.length) { httpUA[0].key = spanAttributeNames.HOST_REQUEST_USER_AGENT; }
    /* eslint-disable no-undef */
    spanAttributes[attributesLength] = { key: spanAttributeNames.BROWSER_HOST, value: { stringValue: window.location.hostname } };
    attributesLength += 1;
    /* eslint-disable no-undef */
    spanAttributes[attributesLength] = { key: spanAttributeNames.BROWSER_PATH, value: { stringValue: window.location.pathname } };
    span.attributes = spanAttributes.filter((attr) => {
      if (this.config.metadataOnly) {
        return attr.key !== span && attr.key !== spanAttributeNames.RESPONSE_CONTENT_LENGTH;
      }
      return attr.key !== spanAttributeNames.RESPONSE_CONTENT_LENGTH_EPS;
    });
    return { attributesLength, span, spanAttributes };
  }
}

export default EpsagonExporter;
