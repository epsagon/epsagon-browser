class EpsagonUtils {
  static addEpsSpanAttrs(span, parentSpan) {
    if (parentSpan.identifyFields) {
      const {
        userId, userName, userEmail, companyId, companyName,
      } = parentSpan.identifyFields;
      if (userId) span.setAttribute('user.id', parentSpan.identifyFields.userId);
      if (userName) span.setAttribute('user.name', parentSpan.identifyFields.name);
      if (userEmail) span.setAttribute('user.email', parentSpan.identifyFields.email);
      if (companyId) span.setAttribute('company.id', parentSpan.identifyFields.companyId);
      if (companyName) span.setAttribute('company.name', parentSpan.identifyFields.companyName);
    }
    if (parentSpan.tags) {
      for (const key in parentSpan.tags) {
        span.setAttribute(key, parentSpan.tags[key]);
      }
    }
  }

  static parseURL(httpUrl, span, spanAttributes, attributesLength, metadataOnly) {
    if (httpUrl.indexOf('?') < 0 && httpUrl.indexOf(';') < 0) {
      const path = httpUrl.substring(httpUrl.indexOf(span.name) + span.name.length);
      spanAttributes[attributesLength] = { key: 'http.request.path', value: { stringValue: path } };
      attributesLength = attributesLength + 1;
    }
    if (httpUrl.indexOf('?') > 0) {
      const path = httpUrl.substring(httpUrl.indexOf(span.name) + span.name.length, httpUrl.indexOf('?'));
      spanAttributes[attributesLength] = { key: 'http.request.path', value: { stringValue: path } };
      attributesLength = attributesLength + 1;
      if (!metadataOnly) {
        const query = httpUrl.substring(httpUrl.indexOf('?'));
        spanAttributes[attributesLength] = { key: 'http.request.query', value: { stringValue: query } };
        attributesLength = attributesLength + 1;
      }
    }
    if (httpUrl.indexOf(';') > 0) {
      const path = httpUrl.substring(httpUrl.indexOf(span.name) + span.name.length, httpUrl.indexOf(';'));
      spanAttributes[attributesLength] = { key: 'http.request.path', value: { stringValue: path } };
      attributesLength = attributesLength + 1;
      if (!metadataOnly) {
        const params = httpUrl.substring(httpUrl.indexOf(';'));
        spanAttributes[attributesLength] = { key: 'http.request.path_params', value: { stringValue: params } };
        attributesLength = attributesLength + 1;
      }
    }

    return attributesLength;
  }

  static getFirstAttribute(span) {
    if (span && span.attributes && span.attributes.length) {
      return span.attributes[0];
    }
    return null;
  }

  static getFirstResourceSpan(span) {
    if (span && span.resourceSpans && span.resourceSpans.length) {
      return span.resourceSpans[0];
    }
    return null;
  }
}

export default EpsagonUtils;
