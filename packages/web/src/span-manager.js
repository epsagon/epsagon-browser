import EpsagonFormatter from './formatter';

class EpsagonResourceManager {
  constructor(config) {
    super(config);
    this.config = config;
  }

  addResourceAttrs(_convertedSpans) {
    const convertedSpans = _convertedSpans;

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
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'user.ip', value: { stringValue: this.userAgent.browser.ip } };
      resourcesLength++;
    }
    //ADD COUNTRY IF EXISTS
    if (this.userAgent.browser.country) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'user.country', value: { stringValue: this.userAgent.browser.country } };
      resourcesLength++;
    }

    //ADD CITY IF EXISTS
    if (this.userAgent.browser.city) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'user.city', value: { stringValue: this.userAgent.browser.city } };
      resourcesLength++;
    }

    //ADD REGION IF EXISTS
    if (this.userAgent.browser.regionName) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'user.region', value: { stringValue: this.userAgent.browser.regionName } };
      resourcesLength++;
    }

    // remove undefined service.name attr
    convertedSpans.resourceSpans[0].resource.attributes = convertedSpans.resourceSpans[0].resource.attributes.filter((attr) => attr.key != ['service.name']);
    return convertedSpans;
  }
}

export default EpsagonResourceManager;
