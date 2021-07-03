import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';
import EpsagonFormatter from './formatter';

const rootType = {
  EPS: 'epsagon_init',
  DOC: 'document_load',
  REDIR: 'redirect',
};
class EpsagonExporter extends CollectorTraceExporter {
  constructor(config, ua) {
    super(config);
    this.config = config;
    this.userAgent = ua;
    this.formatter = new EpsagonFormatter(config)

    // start requesting for ip
    fetch('https://api.ipify.org?format=json', {
      eps: true, // added to negate span creation
      })
      .then(response => response.json())
      .then(data => {
        this.userAgent.browser.ip = data.ip
        fetch(`http://ip-api.com/json/${data.ip}?fields=16665`, {
          eps: true, // added to negate span creation
          })
          .then(response2 => response2.json())
          .then(data2 => {
              this.userAgent.browser.country = data2.country
              this.userAgent.browser.regionName = data2.regionName
              this.userAgent.browser.city = data2.city
              this.userAgent.browser.timezone = data2.timezone
            });
      });
  }

  convert(spans) {
    try {
      const convertedSpans = super.convert(spans);
      const spansList = convertedSpans.resourceSpans[0].instrumentationLibrarySpans;
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

          if (span.name === 'epsagon_init') {
            rootSpan.eps.position = spanIndex;
            rootSpan.eps.subPosition = spanSubIndex;
            rootSpan.eps.spanId = span.spanId;
            attributesLength = this.formatter.formatDocumentLoadSpan(span, spanAttributes, attributesLength);
          }
          if (span.name === 'error') {
            if (span.attributes[0]) {
              rootSpan.doc.position = spanIndex;
              errSpan.messages.push(span.attributes[0].value.stringValue);
            }
            break;
          }

          const httpHost = spanAttributes.filter((attr) => attr.key === 'http.host');
          const userInteraction = spanAttributes.filter((attr) => attr.value.stringValue === 'user-interaction');
          const documentLoad = spanAttributes.filter((attr) => attr.value.stringValue === 'document-load');
          const reactUpdates = spanAttributes.filter((attr) => attr.key === 'react_component_name');

          if (httpHost.length > 0) {
            attributesLength = this.formatter.formatHttpRequestSpan(span, httpHost, spanAttributes, attributesLength);
          } else if (userInteraction.length > 0) {
            attributesLength = this.formatter.formatUserInteractionSpan(spanAttributes, attributesLength);
          } else if (documentLoad.length > 0 || reactUpdates.length > 0) {
            rootSpan.doc.position = spanIndex;

            // replace root span with document load
            if (span.name === 'documentLoad') {
              rootSpan.rootType = rootType.DOC;
              rootSpan.eps.remove = true;
              rootSpan.doc.subPosition = spanSubIndex;
              rootSpan.doc.parent = span.parentSpanId;
            }

            attributesLength = this.formatter.formatDocumentLoadSpan(span, spanAttributes, attributesLength);
          } else if (span.name === 'route_change') {
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

      this.addResourceAttrs(convertedSpans);

      return convertedSpans;
    } catch (err) {
      console.log('error converting and exporting', err);
    }
  }

  handleErrors(errSpan, spansList, rootSpan) {
    if (rootSpan.rootType === rootType.REDIR || rootSpan.rootType === rootType.DOC) {
      let type;
      rootSpan.rootType === rootType.REDIR ? type = 'redirect' : type = 'doc';
      const rootSubList = spansList[rootSpan[type].position].spans;
      const rootSubPos = rootSpan[type].subPosition;

      // errors get converted from their own spans to an event on the root span
      const s = new Set(errSpan.messages);
      Array.from(s.values()).map((err) => {
        rootSubList[rootSubPos].events.unshift({
          name: 'exception',
          attributes: [
            { key: 'exception.message', value: { stringValue: err } },
          ],
        });
      });
      rootSubList[rootSpan[type].subPosition].status.code = 2;
      spansList[rootSpan.doc.position].spans = spansList[rootSpan.doc.position].spans.filter((span) => span.name != 'error');
    } else {
      /// remove duplicate events and add attrs
      const spanErrs = [];
      const finalSpans = [];
      spansList[rootSpan.doc.position].spans.map((span) => {
        if (!spanErrs.includes(span.attributes[0].value.stringValue)) {
          const errAttr = span.attributes.filter((attr) => attr.key === 'message');
          spanErrs.push(errAttr[0].value.stringValue);
          const attributesLength = this.addFinalGenericSpanAttrs(span.attributes, span.attributes.length, span);
          span.name = window.location.pathname;
          span.events.unshift({
            name: 'exception',
            attributes: [
              { key: 'exception.message', value: { stringValue: errAttr[0].value.stringValue } },
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
    const httpUA = spanAttributes.filter((attr) => attr.key === 'http.user_agent');
    if (httpUA.length > 0) { httpUA[0].key = 'http.request.headers.User-Agent'; }
    spanAttributes[attributesLength] = { key: 'browser.host', value: { stringValue: window.location.hostname } };
    attributesLength++;
    spanAttributes[attributesLength] = { key: 'browser.path', value: { stringValue: window.location.pathname } };
    span.attributes = spanAttributes.filter((attr) => {
      if(this.config.metadataOnly){
        return attr.key != 'http.response_content_length_eps' && attr.key != 'http.response_content_length'
      }else{
        return attr.key != 'http.response_content_length_eps'
      }
      
    });
    return attributesLength;
  }

  addResourceAttrs(convertedSpans) {
    const appName = this.config.serviceName;
    let resourcesLength = convertedSpans.resourceSpans[0].resource.attributes.length;

    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'application', value: { stringValue: appName } };
    resourcesLength++;
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.name', value: { stringValue: this.userAgent.browser.name } };
    resourcesLength++;
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.version', value: { stringValue: this.userAgent.browser.version } };
    resourcesLength++;
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.operating_system', value: { stringValue: this.userAgent.os.name } };
    resourcesLength++;
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.operating_system_version', value: { stringValue: this.userAgent.os.version } };
    resourcesLength++;

    //ADD IP IF EXISTS
    if (this.userAgent.browser.ip) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.ip', value: { stringValue: this.userAgent.browser.ip } };
      resourcesLength++;
    }
    //ADD COUNTRY IF EXISTS
    if (this.userAgent.browser.country) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.country', value: { stringValue: this.userAgent.browser.country } };
      resourcesLength++;
    }

    //ADD CITY IF EXISTS
    if (this.userAgent.browser.city) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.city', value: { stringValue: this.userAgent.browser.city } };
      resourcesLength++;
    }

    //ADD REGION IF EXISTS
    if (this.userAgent.browser.regionName) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.regionName', value: { stringValue: this.userAgent.browser.regionName } };
      resourcesLength++;
    }

    //ADD TIMEZONE IF EXISTS
    if (this.userAgent.browser.timezone) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.timezone', value: { stringValue: this.userAgent.browser.timezone } };
      resourcesLength++;
    }

    // remove undefined service.name attr
    convertedSpans.resourceSpans[0].resource.attributes = convertedSpans.resourceSpans[0].resource.attributes.filter((attr) => attr.key != ['service.name']);
  }
}

export default EpsagonExporter;
