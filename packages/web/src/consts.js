const VERSION = require('../package.json').version;

const DEFAULT_CONFIGURATIONS = {
  appName: 'Epsagon Application',
  collectorURL: 'https://opentelemetry.tc.epsagon.com/traces',
  pageLoadTimeout: 30000,
  redirectTimeout: 3000,
  maxBatchSize: 512,
  maxQueueSize: 2048,
  scheduledDelayMillis: 5000,
  exportTimeoutMillis: 30000,
  networkSamplingRatio: 1,
};

const ROOT_TYPE = {
  EPS: 'epsagon_init',
  DOC: 'document_load',
  REDIR: 'redirect',
  ROOT_TYPE_DOC: 'doc',
  ERROR: 'error',
  EXCEPTION: 'exception',
};

const SPAN_ATTRIBUTES_NAMES = {
  BROWSER_HOST: 'browser.host',
  BROWSER_PATH: 'browser.path',
  HOST_HEADER: 'http.host',
  HOST_USER_AGENT: 'http.user_agent',
  HOST_REQUEST_USER_AGENT: 'http.request.headers.User-Agent',
  DOCUMENT_LOAD: 'document-load',
  DOCUMENT_LOAD_SPAN_NAME: 'documentLoad',
  REACT_COMPONENT_NAME: 'react_component_name',
  USER_INTERACTION: 'user-interaction',
  ROUTE_CHANGE: 'route_change',
  RESPONSE_CONTENT_LENGTH: 'http.response_content_length',
  RESPONSE_CONTENT_LENGTH_EPS: 'http.response_content_length_eps',
  EXCEPTION_MESSAGE: 'exception.message',
  EXCEPTION_TYPE: 'exception.type',
  EXCEPTION_STACK: 'exception.stacktrace',
  MESSAGE: 'message',
};

export {
  VERSION, DEFAULT_CONFIGURATIONS, ROOT_TYPE, SPAN_ATTRIBUTES_NAMES,
};
