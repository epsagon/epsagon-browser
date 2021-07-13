const JSDOM = require( "jsdom" ).JSDOM;
const fetch = require('node-fetch');
const sinon = require("sinon");

/**
 *  Simulate browser environment for nodejs.
 */
module.exports.browserenv =  function() {
  const cfg       = { url: "http://localhost" };
  const dom       = new JSDOM( "", cfg );
  global.window   = dom.window;
  global.document = dom.window.document;

  Object.keys( global.window ).forEach(( property ) => {
    if ( typeof global[ property ] === "undefined" ) {
         global[ property ] = global.window[ property ];
    }
  });

  global.Element = window.Element;
//   global.Image     = window.Image;
//   // maybe more of: global.Whatever = window.Whatever

  global.navigator = {
    userAgent: "node.js"
  };

  if (!globalThis.fetch) {
    globalThis.fetch = fetch;
  };

  globalThis.XMLHttpRequest = sinon.useFakeXMLHttpRequest();
  var requests = this.requests = [];

  globalThis.XMLHttpRequest.onCreate = function (xhr) {
    requests.push(xhr);
  };
}

module.exports.restore = () => {
    globalThis.XMLHttpRequest.restore();
}