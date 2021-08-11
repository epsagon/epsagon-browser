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

/**
 *  Simulate browser environment for nodejs.
 */
module.exports.browserenv = function () {
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

  const res = epsagon.init({ token: 'dfsaf', isTest: true });
  return res.epsSpan;
};

module.exports.createError = () => {
  const e = new window.ErrorEvent('error', { error: { message: 'my error' }, message: 'myerror' });
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
