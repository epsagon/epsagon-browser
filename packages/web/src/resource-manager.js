import { VERSION } from './consts';

class EpsagonResourceManager {
  constructor(config) {
    this.config = config;
  }

  addResourceAttrs(_convertedSpans, userAgent) {
    const convertedSpans = _convertedSpans;

    const appName = this.config.serviceName;
    let resourcesLength = convertedSpans.resourceSpans[0].resource.attributes.length;

    // WE CANT USE THE NATIVE OPENTELEMETRY ADDATTRIBUTE SINCE IT WILL SHUTDOWN THE SPAN
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'application', value: { stringValue: appName } };
    resourcesLength += 1;
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.name', value: { stringValue: userAgent.browser.name } };
    resourcesLength += 1;
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.version', value: { stringValue: userAgent.browser.version } };
    resourcesLength += 1;
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.operating_system', value: { stringValue: userAgent.os.name } };
    resourcesLength += 1;
    convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'browser.operating_system_version', value: { stringValue: userAgent.os.version } };
    resourcesLength += 1;

    // ADD VERSION IF EXISTS
    if (VERSION) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'epsagon.version', value: { stringValue: VERSION } };
      resourcesLength += 1;
    }

    // ADD IP IF EXISTS
    if (userAgent.browser.ip) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'user.ip', value: { stringValue: userAgent.browser.ip } };
      resourcesLength += 1;
    }
    // ADD COUNTRY IF EXISTS
    if (userAgent.browser.country) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'user.country', value: { stringValue: userAgent.browser.country } };
      resourcesLength += 1;
    }

    // ADD CITY IF EXISTS
    if (userAgent.browser.city) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'user.city', value: { stringValue: userAgent.browser.city } };
      resourcesLength += 1;
    }

    // ADD REGION IF EXISTS
    if (userAgent.browser.regionName) {
      convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'user.region', value: { stringValue: userAgent.browser.regionName } };
      resourcesLength += 1;
    }

    // remove undefined service.name attr
    convertedSpans.resourceSpans[0].resource.attributes = convertedSpans.resourceSpans[0].resource.attributes.filter((attr) => attr.key !== ['service.name']);
    return convertedSpans;
  }
}

export default EpsagonResourceManager;
