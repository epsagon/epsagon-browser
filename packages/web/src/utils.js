class EpsagonUtils {
  static addEpsSpanAttrs(span, parentSpan) {
    if (parentSpan.identifyFields) {
      const {
        userId, userName, userEmail, companyId, companyName,
      } = parentSpan.identifyFields;
      if (userId) span.setAttribute('user.id', parentSpan.identifyFields.userId);
      if (userName) span.setAttribute('user.name', parentSpan.identifyFields.userName);
      if (userEmail) span.setAttribute('user.email', parentSpan.identifyFields.userEmail);
      if (companyId) span.setAttribute('company.id', parentSpan.identifyFields.companyId);
      if (companyName) span.setAttribute('company.name', parentSpan.identifyFields.companyName);
    }
    if (parentSpan.tags) {
      Object.keys(parentSpan.tags).forEach((key) => {
        span.setAttribute(key, parentSpan.tags[key]);
      });
    }
  }

  static parseURL(httpUrl, span, _spanAttributes, _attributesLength, metadataOnly) {
    let attributesLength = _attributesLength;
    const spanAttributes = _spanAttributes;

    if (httpUrl.indexOf('?') < 0 && httpUrl.indexOf(';') < 0) {
      const path = httpUrl.substring(httpUrl.indexOf(span.name) + span.name.length);
      spanAttributes[attributesLength] = { key: 'http.request.path', value: { stringValue: path } };
      attributesLength += 1;
    }
    if (httpUrl.indexOf('?') > 0) {
      const path = httpUrl.substring(httpUrl.indexOf(span.name) + span.name.length, httpUrl.indexOf('?'));
      spanAttributes[attributesLength] = { key: 'http.request.path', value: { stringValue: path } };
      attributesLength += 1;
      if (!metadataOnly) {
        const query = httpUrl.substring(httpUrl.indexOf('?'));
        spanAttributes[attributesLength] = { key: 'http.request.query', value: { stringValue: query } };
        attributesLength += 1;
      }
    }
    if (httpUrl.indexOf(';') > 0) {
      const path = httpUrl.substring(httpUrl.indexOf(span.name) + span.name.length, httpUrl.indexOf(';'));
      spanAttributes[attributesLength] = { key: 'http.request.path', value: { stringValue: path } };
      attributesLength += 1;
      if (!metadataOnly) {
        const params = httpUrl.substring(httpUrl.indexOf(';'));
        spanAttributes[attributesLength] = { key: 'http.request.path_params', value: { stringValue: params } };
        attributesLength += 1;
      }
    }

    return {
      attributesLength,
      spanAttributes,
    };
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

  static genErrorAttribution(error) {
    return [
      this.verifyAttributionStringValue('exception.message', error.message, 'exception'),
      this.verifyAttributionStringValue('exception.type', error.type, 'exception'),
      this.verifyAttributionStringValue('exception.stacktrace', error.stack, 'exception'),
    ];
  }

  static verifyAttributionStringValue(keyValue, value, defaultValue) {
    if (value && value.length > 0) {
      return { key: keyValue, value: { stringValue: value } };
    }
    return { key: keyValue, value: { stringValue: defaultValue } };
  }
}

export default EpsagonUtils;
