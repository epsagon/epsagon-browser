/* eslint-disable no-console */
/* eslint-disable max-len */
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';
import { diag } from '@opentelemetry/api';
import { loggingErrorHandler } from '@opentelemetry/core';
import EpsagonFormatter from './formatter';
import EpsagonResourceManager from './resource-manager';
import EpsagonIPCalculator from './ip-calculator';
import EpsagonUtils from './utils';
import { ROOT_TYPE, SPAN_ATTRIBUTES_NAMES } from './consts';

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
    try {
      const errorSpans = spans.filter((s) => s.exceptionData);
      const convertedSpans = super.convert(spans);
      let spansList = EpsagonUtils.getFirstResourceSpan(convertedSpans).instrumentationLibrarySpans;
      const rootSpan = {
        rootType: ROOT_TYPE.EPS,
        eps: {},
        doc: {},
        redirect: {},
      };
      const errSpan = {
        messages: [],
      };

      Object.keys(spansList).forEach((spanIndex) => {
        const spanSubList = spansList[spanIndex].spans;
        diag.debug('Handle spans for index ', spanIndex);

        /* eslint-disable no-restricted-syntax */
        for (const spanSubIndex in spanSubList) {
          if (spanSubList[spanSubIndex]) {
            let span = spanSubList[spanSubIndex];
            let spanAttributes = span.attributes;
            let attributesLength = spanAttributes.length;

            if (span.name === ROOT_TYPE.EPS) {
              diag.debug('Handle epsagon_init span', span);
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
            if (span.name === ROOT_TYPE.ERROR) {
              if (span.attributes && span.attributes.length) {
                rootSpan.doc.position = spanIndex;
                errSpan.messages.push(EpsagonUtils.getFirstAttribute(span).value.stringValue);
              }
              break;
            }

            const httpHost = spanAttributes.filter((attr) => attr.key === SPAN_ATTRIBUTES_NAMES.HOST_HEADER);
            const userInteraction = spanAttributes.filter((attr) => attr.value.stringValue === SPAN_ATTRIBUTES_NAMES.USER_INTERACTION);
            const documentLoad = spanAttributes.filter((attr) => attr.value.stringValue === SPAN_ATTRIBUTES_NAMES.DOCUMENT_LOAD);
            const reactUpdates = spanAttributes.filter((attr) => attr.key === SPAN_ATTRIBUTES_NAMES.REACT_COMPONENT_NAME);

            if (httpHost.length > 0) {
              diag.debug('httpHost:', httpHost);
              const formattedHttpRequestSpan = this.formatter.formatHttpRequestSpan(span, httpHost, spanAttributes, attributesLength);
              spanAttributes = formattedHttpRequestSpan.spanAttributes;
              attributesLength = formattedHttpRequestSpan.attributesLength;
              span = formattedHttpRequestSpan.span;
            } else if (userInteraction.length > 0) {
              diag.debug('userInteraction:', userInteraction);
              const formattedSpan = EpsagonFormatter.formatUserInteractionSpan(spanAttributes, attributesLength);
              spanAttributes[attributesLength] = formattedSpan.userInteraction;
              attributesLength += 1;
              spanAttributes[attributesLength] = formattedSpan.operation;
              attributesLength += 1;
            } else if (documentLoad.length > 0 || reactUpdates.length > 0) {
              diag.debug('document load:', documentLoad);
              diag.debug('react updates:', reactUpdates);
              rootSpan.doc.position = spanIndex;

              // replace root span with document load
              if (span.name === SPAN_ATTRIBUTES_NAMES.DOCUMENT_LOAD_SPAN_NAME) {
                rootSpan.rootType = ROOT_TYPE.DOC;
                rootSpan.eps.remove = true;
                rootSpan.doc.subPosition = spanSubIndex;
                rootSpan.doc.parent = span.parentSpanId;
                diag.debug('replace root span with document load:', rootSpan);
              }

              const formattedSpan = EpsagonFormatter.formatDocumentLoadSpan();
              span.name = formattedSpan.name;
              spanAttributes[attributesLength] = formattedSpan.browser;
              attributesLength += 1;
              spanAttributes[attributesLength] = formattedSpan.operation;
              attributesLength += 1;
            } else if (span.name === SPAN_ATTRIBUTES_NAMES.ROUTE_CHANGE) {
              diag.debug('span name is route_change');
              rootSpan.rootType = ROOT_TYPE.REDIR;

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
        diag.debug('Error spans:', spansList);
      }

      if (rootSpan.eps.remove && rootSpan.doc.parent === rootSpan.eps.spanId) {
        diag.debug('Remove document load span');
        const docLoad = spansList[rootSpan.doc.position].spans[0];
        docLoad.parentSpanId = undefined;
        docLoad.spanId = rootSpan.eps.spanId;
        spansList.splice(rootSpan.eps.position, 1);
      }

      const convertedSpansWithRecourseAtts = this.resourceManager.addResourceAttrs(convertedSpans, this.userAgent);
      diag.debug('converted spans:', convertedSpansWithRecourseAtts);
      return convertedSpansWithRecourseAtts;
    } catch (err) {
      diag.warn('error converting and exporting', err);
      return null;
    }
  }

  static handleErrors(errorSpans, _spansList, rootSpan) {
    diag.debug('handle errors:', errorSpans);
    const spansList = _spansList;
    if (rootSpan.rootType === ROOT_TYPE.REDIR || rootSpan.rootType === ROOT_TYPE.DOC) {
      diag.debug('rootType:', ROOT_TYPE);
      const type = rootSpan.rootType === ROOT_TYPE.REDIR ? ROOT_TYPE.REDIR : ROOT_TYPE.ROOT_TYPE_DOC;
      const rootSubList = spansList[rootSpan[type].position].spans;
      const rootSubPos = rootSpan[type].subPosition;

      // errors get converted from their own spans to an event on the root span
      Array.from(errorSpans.values()).forEach((error) => {
        rootSubList[rootSubPos].events.unshift({
          name: ROOT_TYPE.EXCEPTION,
          attributes: error.exceptionData.attributes,
        });
      });
      rootSubList[rootSpan[type].subPosition].status.code = 2;
      spansList[rootSpan.doc.position].spans = spansList[rootSpan.doc.position].spans.filter((span) => span.name !== ROOT_TYPE.ERROR);
    } else {
      diag.debug('remove duplicate events and add attrs.');
      /// remove duplicate events and add attrs
      const finalSpans = [];
      spansList[rootSpan.doc.position].spans.forEach((span) => {
        if (span.name === ROOT_TYPE.ERROR) {
          const errorData = errorSpans.filter((s) => s.traceID === span.traceID);
          const errorDataSpan = errorData && errorData.length ? errorData[0] : errorData;
          /* eslint-disable no-undef */
          // eslint-disable-next-line no-param-reassign
          span.name = `${window.location.pathname}${window.location.hash}`;
          span.events.unshift({
            name: ROOT_TYPE.EXCEPTION,
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
    const httpUA = spanAttributes.filter((attr) => attr.key === SPAN_ATTRIBUTES_NAMES.HOST_USER_AGENT);
    if (httpUA.length) { httpUA[0].key = SPAN_ATTRIBUTES_NAMES.HOST_REQUEST_USER_AGENT; }
    /* eslint-disable no-undef */
    spanAttributes[attributesLength] = { key: SPAN_ATTRIBUTES_NAMES.BROWSER_HOST, value: { stringValue: window.location.hostname } };
    attributesLength += 1;
    /* eslint-disable no-undef */
    spanAttributes[attributesLength] = { key: SPAN_ATTRIBUTES_NAMES.BROWSER_PATH, value: { stringValue: window.location.pathname } };
    span.attributes = spanAttributes.filter((attr) => {
      if (this.config.metadataOnly) {
        return attr.key !== span && attr.key !== SPAN_ATTRIBUTES_NAMES.RESPONSE_CONTENT_LENGTH;
      }
      return attr.key !== SPAN_ATTRIBUTES_NAMES.RESPONSE_CONTENT_LENGTH_EPS;
    });
    diag.debug('FinalGenericSpanAttrs:', spanAttributes);
    return { attributesLength, span, spanAttributes };
  }

  // eslint-disable-next-line no-unused-vars
  send(objects, onSuccess, onError) {
    super.send(objects, onSuccess, loggingErrorHandler());
  }
}

export default EpsagonExporter;
