/* eslint-disable no-underscore-dangle */
import EpsagonUtils from './utils';

class EpsagonFormatter {
  constructor(config) {
    this.config = config;
  }

  static formatRouteChangeSpan(userAgent) {
    /* eslint-disable no-undef */
    return {
      name: `${window.location.pathname}${window.location.hash}`,
      obj: { key: 'http.request.headers.User-Agent', value: { stringValue: JSON.stringify(userAgent).replace(/"([^"]+)":/g, '$1:') } },
    };
  }

  static formatDocumentLoadSpan() {
    return {
      name: `${window.location.pathname}${window.location.hash}`,
      browser: { key: 'type', value: { stringValue: 'browser' } },
      operation: { key: 'operation', value: { stringValue: 'page_load' } },
    };
  }

  static formatUserInteractionSpan(spanAttributes) {
    const eventType = spanAttributes.filter((attr) => attr.key === ('event_type'));
    return {
      operation: { key: 'operation', value: { stringValue: eventType[0].value.stringValue } },
      userInteraction: { key: 'type', value: { stringValue: 'user-interaction' } },
    };
  }

  formatHttpRequestSpan(_span, httpHost, _spanAttributes, _attributesLength) {
    const span = _span;
    let spanAttributes = _spanAttributes;
    let attributesLength = _attributesLength;
    span.name = httpHost[0].value.stringValue;
    spanAttributes[attributesLength] = { key: 'type', value: { stringValue: 'http' } };
    attributesLength += 1;

    if (!this.config.metadataOnly) {
      const httpContentLength = spanAttributes.filter((attr) => attr.key === 'http.response_content_length');
      const epsHttpContentLength = spanAttributes.filter((attr) => attr.key === 'http.response_content_length_eps');
      if (epsHttpContentLength.length > 0) {
        httpContentLength[0].value.intValue = epsHttpContentLength[0].value.intValue;
      }
    }

    const httpUrlAttr = spanAttributes.filter((attr) => attr.key === 'http.url');
    const httpUrl = httpUrlAttr[0].value.stringValue;

    const afterParse = EpsagonUtils.parseURL(
      httpUrl, span, spanAttributes, attributesLength, this.config.metadataOnly,
    );
    attributesLength = afterParse.attributesLength;
    spanAttributes = afterParse.spanAttributes;
    return { span, attributesLength, spanAttributes };
  }
}

export default EpsagonFormatter;
