
class EpsagonUtils {

  static addEpsSpanAttrs(span, parentSpan) {
    if(parentSpan.identifyFields){
        const { userId, userName, userEmail, companyId, companyName } = parentSpan.identifyFields;
        if (userId) span.setAttribute('user.id', parentSpan.identifyFields.userId);
        if (userName) span.setAttribute('user.name', parentSpan.identifyFields.name);
        if (userEmail) span.setAttribute('user.email', parentSpan.identifyFields.email);
        if (companyId) span.setAttribute('company.id', parentSpan.identifyFields.companyId);
        if (companyName) span.setAttribute('company.name', parentSpan.identifyFields.companyName);
    }
    if(parentSpan.tags){
        for(let key in parentSpan.tags){
            span.setAttribute(key, parentSpan.tags[key]);
        }
    }
  }
  
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