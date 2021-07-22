class EpsagonResourceManager {
  constructor(config) {
    this.config = config;
  }

  addResourceAttrs(_convertedSpans) {
    const convertedSpans = _convertedSpans;

    const appName = this.config.serviceName;
    let resourcesLength = convertedSpans.resourceSpans[0].resource.attributes.length;

    // WE CANT USE THE NATIVE OPENTELEMETRY ADDATTRIBUTE SINCE IT WILL SHUTDOWN THE SPAN
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'application', value: { stringValue: appName } };
    resourcesLength += 1;
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.name', value: { stringValue: this.userAgent.browser.name } };
    resourcesLength += 1;
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.version', value: { stringValue: this.userAgent.browser.version } };
    resourcesLength += 1;
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.operating_system', value: { stringValue: this.userAgent.os.name } };
    resourcesLength += 1;
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.operating_system_version', value: { stringValue: this.userAgent.os.version } };
    resourcesLength += 1;

    // ADD IP IF EXISTS
    if (this.userAgent.browser.ip) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'user.ip', value: { stringValue: this.userAgent.browser.ip } };
      resourcesLength += 1;
    }
    // ADD COUNTRY IF EXISTS
    if (this.userAgent.browser.country) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'user.country', value: { stringValue: this.userAgent.browser.country } };
      resourcesLength += 1;
    }

    // ADD CITY IF EXISTS
    if (this.userAgent.browser.city) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'user.city', value: { stringValue: this.userAgent.browser.city } };
      resourcesLength += 1;
    }

    // ADD REGION IF EXISTS
    if (this.userAgent.browser.regionName) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'user.region', value: { stringValue: this.userAgent.browser.regionName } };
      resourcesLength += 1;
    }

    // remove undefined service.name attr
    convertedSpans.resourceSpans[0].resource.attributes = convertedSpans.resourceSpans[0].resource.attributes.filter((attr) => attr.key !== ['service.name']);
    return convertedSpans;
  }
}

export default EpsagonResourceManager;
