import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch/build/src/fetch';
import EpsagonExporter from '../src/exporter';
import EpsagonXMLHttpRequestInstrumentation from '../src/instrumentation/xmlHttpInstrumentation';
import EpsagonFetchInstrumentation from '../src/instrumentation/fetchInstrumentation';

const chai = require('chai');
const sinon = require('sinon');
const helper = require('./helper');

helper.browserenv();
const sandbox = sinon.createSandbox();

let spyExporter;
let spyHeaders;
let spyAttrs;
describe('xhr instrumentation', () => {
  beforeEach(() => {
    Object.defineProperty(global.window.document, 'readyState', {
      writable: true,
      value: 'complete',
    });
    spyHeaders = sandbox.stub(XMLHttpRequestInstrumentation.prototype, '_addHeaders');
    spyHeaders.returns(null);
    spyAttrs = sandbox.stub(EpsagonXMLHttpRequestInstrumentation.prototype, '_addFinalSpanAttributes');
    spyExporter = sandbox.spy(EpsagonExporter.prototype, 'convert');
  });

  afterEach(() => {
    spyExporter.restore();
    spyHeaders.restore();
    spyAttrs.restore();
  });

  it('should construct an instance', (done) => {
    const plugin = new EpsagonXMLHttpRequestInstrumentation({
      enabled: false,
    });
    chai.assert.ok(plugin instanceof EpsagonXMLHttpRequestInstrumentation);
    done();
  });

  it('should create span for xml request', (done) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://jsonplaceholder.typicode.com/photos/', true);
    xhr.send('"test": "1"');
    xhr.abort();
    setTimeout(() => {
      const spans = spyExporter.returnValues[0];
      chai.assert.ok(spans.resourceSpans[0].instrumentationLibrarySpans, 'spans not created');
      const span = spans.resourceSpans[0].instrumentationLibrarySpans.filter((obj) => obj.instrumentationLibrary.name == '@opentelemetry/instrumentation-xml-http-request');
      chai.assert.equal(span[0].spans.length, 1, 'more then one span being created');
      chai.assert.ok(span[0].spans[0].parentSpanId, 'parent span not being set');
      done();
    }, 7000);
  }).timeout(8000);
});

describe('fetch instrumentation', () => {
  beforeEach(() => {
    Object.defineProperty(global.window.document, 'readyState', {
      writable: true,
      value: 'complete',
    });
    spyHeaders = sandbox.stub(FetchInstrumentation.prototype, '_addHeaders');
    spyAttrs = sandbox.stub(FetchInstrumentation.prototype, '_addFinalSpanAttributes');
    spyExporter = sandbox.spy(EpsagonExporter.prototype, 'convert');
  });

  afterEach(() => {
    spyExporter.restore();
    spyHeaders.restore();
    spyAttrs.restore();
  });

  it('should create span for fetch request', (done) => {
    window.fetch('https://jsonplaceholder.typicode.com/photos/').then(() => {
      setTimeout(() => {
        const spans = spyExporter.returnValues[0];
        chai.assert.ok(spans.resourceSpans[0].instrumentationLibrarySpans, 'spans not created');
        const span = spans.resourceSpans[0].instrumentationLibrarySpans.filter((obj) => obj.instrumentationLibrary.name == '@opentelemetry/instrumentation-fetch');
        chai.assert.equal(span[0].spans.length, 1, 'more then one span being created');
        chai.assert.ok(span[0].spans[0].parentSpanId, 'parent span not being set');
        done();
      }, 6000);
    });
  }).timeout(7000);
});

after(() => sandbox.restore());
