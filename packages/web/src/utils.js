
class EpsagonUtils {
  static parseURL(httpUrl, span, spanAttributes, attributesLength, metadataOnly) {
    if (httpUrl.indexOf('?') < 0 && httpUrl.indexOf(';') < 0) {
      const path = httpUrl.substring(httpUrl.indexOf(span.name) + span.name.length);
      spanAttributes[attributesLength] = { key: 'http.request.path', value: { stringValue: path } };
      attributesLength++;
    }
    if (httpUrl.indexOf('?') > 0) {
      const path = httpUrl.substring(httpUrl.indexOf(span.name) + span.name.length, httpUrl.indexOf('?'));
      spanAttributes[attributesLength] = { key: 'http.request.path', value: { stringValue: path } };
      attributesLength++;
      if(!metadataOnly){
        const query = httpUrl.substring(httpUrl.indexOf('?'));
        spanAttributes[attributesLength] = { key: 'http.request.query', value: { stringValue: query } };
        attributesLength++;
      }
    }
    if (httpUrl.indexOf(';') > 0) {
      const path = httpUrl.substring(httpUrl.indexOf(span.name) + span.name.length, httpUrl.indexOf(';'));
      spanAttributes[attributesLength] = { key: 'http.request.path', value: { stringValue: path } };
      attributesLength++;
      if(!metadataOnly){
        const params = httpUrl.substring(httpUrl.indexOf(';'));
        spanAttributes[attributesLength] = { key: 'http.request.path_params', value: { stringValue: params } };
        attributesLength++;
      }
    }

    return attributesLength;
  }
}

export default EpsagonUtils;
