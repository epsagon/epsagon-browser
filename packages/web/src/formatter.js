import EpsagonUtils from './utils';

class EpsagonFormatter {
  formatRouteChangeSpan(span, spanAttributes, attributesLength, userAgent) {
    span.name = window.location.pathname;
    spanAttributes[attributesLength] = { key: 'http.request.headers.User-Agent', value: { stringValue: JSON.stringify(userAgent).replace(/"([^"]+)":/g, '$1:') } };
    attributesLength++;
    return attributesLength;
  }

  formatDocumentLoadSpan(span, spanAttributes, attributesLength) {
    span.name = window.location.pathname;
    spanAttributes[attributesLength] = { key: 'type', value: { stringValue: 'browser' } };
    attributesLength++;
    spanAttributes[attributesLength] = { key: 'operation', value: { stringValue: 'page_load' } };
    attributesLength++;
    return attributesLength;
  }

  formatUserInteractionSpan(spanAttributes, attributesLength) {
    spanAttributes[attributesLength] = { key: 'type', value: { stringValue: 'user-interaction' } };
    attributesLength++;
    const eventType = spanAttributes.filter((attr) => attr.key === ('event_type'));
    spanAttributes[attributesLength] = { key: 'operation', value: { stringValue: eventType[0].value.stringValue } };
    attributesLength++;
    return attributesLength;
  }


  formatHttpRequestSpan(span, httpHost, spanAttributes, attributesLength, config) {
    span.name = httpHost[0].value.stringValue;
    spanAttributes[attributesLength] = { key: 'type', value: { stringValue: 'http' } };
    attributesLength++;

    const httpContentLength = spanAttributes.filter((attr) => attr.key === 'http.response_content_length');
    const epsHttpContentLength = spanAttributes.filter((attr) => attr.key === 'http.response_content_length_eps');
    if (epsHttpContentLength.length > 0) {
      httpContentLength[0].value.intValue = epsHttpContentLength[0].value.intValue;
    }

    const httpUrlAttr = spanAttributes.filter((attr) => attr.key === 'http.url');
    const httpUrl = httpUrlAttr[0].value.stringValue;
    attributesLength = EpsagonUtils.parseURL(httpUrl, span, spanAttributes, attributesLength, config);
    return attributesLength;
  }
}

export default EpsagonFormatter;
