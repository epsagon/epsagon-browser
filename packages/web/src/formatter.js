/* eslint-disable no-underscore-dangle */
import EpsagonUtils from './utils';

class EpsagonFormatter {
  constructor(config) {
    this.config = config;
  }

  formatRouteChangeSpan(span, spanAttributes, attributesLength, userAgent) {
    /* eslint-disable no-undef */
    span.name = `${window.location.pathname}${window.location.hash}`;
    spanAttributes[attributesLength] = { key: 'http.request.headers.User-Agent', value: { stringValue: JSON.stringify(userAgent).replace(/"([^"]+)":/g, '$1:') } };
    attributesLength += 1;
    return attributesLength;
  }

  formatDocumentLoadSpan(span, spanAttributes, attributesLength) {
    /* eslint-disable no-undef */
    span.name = `${window.location.pathname}${window.location.hash}`;
    spanAttributes[attributesLength] = { key: 'type', value: { stringValue: 'browser' } };
    attributesLength += 1;
    spanAttributes[attributesLength] = { key: 'operation', value: { stringValue: 'page_load' } };
    attributesLength += 1;
    return attributesLength;
  }

  formatUserInteractionSpan(spanAttributes, attributesLength) {
    spanAttributes[attributesLength] = { key: 'type', value: { stringValue: 'user-interaction' } };
    attributesLength += 1;
    const eventType = spanAttributes.filter((attr) => attr.key === ('event_type'));
    spanAttributes[attributesLength] = { key: 'operation', value: { stringValue: eventType[0].value.stringValue } };
    attributesLength += 1;
    return attributesLength;
  }

  formatHttpRequestSpan(span, httpHost, spanAttributes, attributesLength) {
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
    attributesLength = EpsagonUtils.parseURL(httpUrl, span, spanAttributes, attributesLength, this.config.metadataOnly);

    return attributesLength;
  }
}

export default EpsagonFormatter;
