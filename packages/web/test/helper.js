const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const sinon = require('sinon');
import { diag } from "@opentelemetry/api";
const epsagon = require('../src/web-tracer');


class Request {
  constructor() {
    diag.debug('doesnt matter');
  }
}

const defaults = {
  errorDisabled: false
};

/**
 *  Simulate browser environment for nodejs.
 */
module.exports.browserenv = function (options = defaults) {
  const cfg = { url: 'http://localhost' };
  const dom = new JSDOM('', cfg);
  global.window = dom.window;
  global.document = dom.window.document;

  Object.keys(global.window).forEach((property) => {
    if (typeof global[property] === 'undefined') {
      global[property] = global.window[property];
    }
  });

  global.Element = window.Element;
  //   global.Image     = window.Image;
  //   // maybe more of: global.Whatever = window.Whatever

  global.navigator = {
    userAgent: 'node.js',
  };

  globalThis.fetch = fetch;
  globalThis.window.fetch = globalThis.fetch;

  global.document.getElementsByTagName = (name = meta) => [{
    name: 'page name',
    getAttribute: () => name,
  }];

  globalThis.performance = global.window.performance;
  globalThis.window = global.window;
  globalThis.document = global.document;

  globalThis.XMLHttpRequest = sinon.useFakeXMLHttpRequest();
  const requests = this.requests = [];

  globalThis.XMLHttpRequest.onCreate = function (xhr) {
    requests.push(xhr);
  };

  globalThis.Request = Request;

  let initArgs = {
    ...{ token: 'dfsaf', isTest: true },
    ...options
  };

  const res = epsagon.init(initArgs);
  return res.epsSpan;
};

module.exports.createError = () => {
  const e = new window.ErrorEvent('error', { error: { message: 'my error', type: 'my error type' }, message: 'myerror' });
  window.dispatchEvent(e);
};

module.exports.createEmptyStackError = () => {
  const err = new Error();
  err.message = 'my error';
  err.type = 'my error type';
  err.stack = {};
  const e = new window.ErrorEvent('error', {error :err});
  window.dispatchEvent(e);
};

module.exports.restore = () => {
  globalThis.XMLHttpRequest.restore();
};

module.exports.type = {
  DOC: 'browser',
  HTTP: 'http',
};

module.exports.operations = {
  LOAD: 'page_load',
  ROUTE: 'route_change',
};
