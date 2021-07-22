import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';
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
  MESSAGE: 'message'
}

class EpsagonExporter extends CollectorTraceExporter {
  constructor(config, ua) {
    super(config);
    this.config = config;
    this.userAgent = ua;
    this.formatter = new EpsagonFormatter(config)
    this.resourceManager = new EpsagonResourceManager(config)
    this.ipCalcualtor = new EpsagonIPCalculator(config)
    this.ipCalcualtor.calculate((data) => {
      this.userAgent.browser.ip = data.ip
      this.userAgent.browser.country = data.country
      this.userAgent.browser.regionName = data.regionName
      this.userAgent.browser.city = data.city
    })
  }

  convert(spans) {
    console.log(spans)
    try {
      const convertedSpans = super.convert(spans);
      const spansList = EpsagonUtils.getFirstResourceSpan(convertedSpan).instrumentationLibrarySpans;
      const rootSpan = {
        rootType: rootType.EPS,
        eps: {},
        doc: {},
        redirect: {},
      };
      const errSpan = {
        messages: [],
      };

      for (const spanIndex in spansList) {
        const spanSubList = spansList[spanIndex].spans;

        for (const spanSubIndex in spanSubList) {
          const span = spanSubList[spanSubIndex];
          const spanAttributes = span.attributes;
          let attributesLength = spanAttributes.length;

          if (span.name === rootType.EPS) {
            rootSpan.eps.position = spanIndex;
            rootSpan.eps.subPosition = spanSubIndex;
            rootSpan.eps.spanId = span.spanId;
            attributesLength = this.formatter.formatDocumentLoadSpan(span, spanAttributes, attributesLength);
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
            attributesLength = this.formatter.formatHttpRequestSpan(span, httpHost, spanAttributes, attributesLength);
          } else if (userInteraction.length > 0) {
            attributesLength = this.formatter.formatUserInteractionSpan(spanAttributes, attributesLength);
          } else if (documentLoad.length > 0 || reactUpdates.length > 0) {
            rootSpan.doc.position = spanIndex;

            // replace root span with document load
            if (span.name === spanAttributeNames.DOCUMENT_LOAD_SPAN_NAME) {
              rootSpan.rootType = rootType.DOC;
              rootSpan.eps.remove = true;
              rootSpan.doc.subPosition = spanSubIndex;
              rootSpan.doc.parent = span.parentSpanId;
            }

            attributesLength = this.formatter.formatDocumentLoadSpan(span, spanAttributes, attributesLength);
          } else if (span.name === spanAttributeNames.ROUTE_CHANGE) {
            rootSpan.rootType = rootType.REDIR;
            attributesLength = this.formatter.formatRouteChangeSpan(span, spanAttributes, attributesLength, this.userAgent);
            rootSpan.redirect.position = spanIndex;
            rootSpan.redirect.subPosition = spanSubIndex;
          }

          attributesLength = this.addFinalGenericSpanAttrs(spanAttributes, attributesLength, span);
        }
      }

      if (errSpan.messages.length > 0) {
        this.handleErrors(errSpan, spansList, rootSpan);
      }

      if (rootSpan.eps.remove && rootSpan.doc.parent === rootSpan.eps.spanId) {
        const docLoad = spansList[rootSpan.doc.position].spans[0];
        docLoad.parentSpanId = undefined;
        docLoad.spanId = rootSpan.eps.spanId;
        spansList.splice(rootSpan.eps.position, 1);
      }

      return resourceManager.addResourceAttrs(convertedSpans);
    } catch (err) {
      console.log('error converting and exporting', err);
    }
  }

  handleErrors(errSpan, spansList, rootSpan) {
    if (rootSpan.rootType === rootType.REDIR || rootSpan.rootType === rootType.DOC) {
      let type;
      rootSpan.rootType === rootType.REDIR ? type = rootType.REDIR : type = rootType.ROOT_TYPE_DOC;
      const rootSubList = spansList[rootSpan[type].position].spans;
      const rootSubPos = rootSpan[type].subPosition;

      // errors get converted from their own spans to an event on the root span
      const s = new Set(errSpan.messages);
      Array.from(s.values()).map((err) => {
        rootSubList[rootSubPos].events.unshift({
          name: rootType.EXCEPTION,
          attributes: [
            { key: spanAttributeNames.EXCEPTION_MESSAGE, value: { stringValue: err } },
          ],
        });
      });
      rootSubList[rootSpan[type].subPosition].status.code = 2;
      spansList[rootSpan.doc.position].spans = spansList[rootSpan.doc.position].spans.filter((span) => span.name != rootType.ERROR);
    } else {
      /// remove duplicate events and add attrs
      const spanErrs = [];
      const finalSpans = [];
      spansList[rootSpan.doc.position].spans.map((span) => {
        if (span.name === rootType.ERROR && !spanErrs.includes(EpsagonUtils.getFirstAttribute(span).value.stringValue)) {
          const errAttr = span.attributes.filter((attr) => attr.key === spanAttributeNames.MESSAGE);
          const spanStringError = errAttr && errAttr.length ? errAttr[0].value.stringValue : rootType.EXCEPTION

          spanErrs.push(spanStringError);
          span.name = `${window.location.pathname}${window.location.hash}`;
          span.events.unshift({
            name: rootType.EXCEPTION,
            attributes: [
              { key: spanAttributeNames.EXCEPTION_MESSAGE, value: { stringValue: spanStringError } },
            ],
          });
          finalSpans.push(span);
        }
      });
      spansList[rootSpan.doc.position].spans = finalSpans;
    }
  }

  addFinalGenericSpanAttrs(spanAttributes, attributesLength, span) {
    // replace any user agent keys with eps name convention
    const httpUA = spanAttributes.filter((attr) => attr.key === spanAttributeNames.HOST_USER_AGENT);
    if (httpUA.length) { httpUA[0].key = spanAttributeNames.HOST_REQUEST_USER_AGENT; }
    spanAttributes[attributesLength] = { key: spanAttributeNames.BROWSER_HOST, value: { stringValue: window.location.hostname } };
    attributesLength++;
    spanAttributes[attributesLength] = { key: spanAttributeNames.BROWSER_PATH, value: { stringValue: window.location.pathname } };
    span.attributes = spanAttributes.filter((attr) => {
      if (this.config.metadataOnly) {
        return attr.key != span && attr.key != spanAttributeNames.RESPONSE_CONTENT_LENGTH
      } else {
        return attr.key != spanAttributeNames.RESPONSE_CONTENT_LENGTH_EPS
      }
      
    });
    return attributesLength;
  }
}

export default EpsagonExporter;
