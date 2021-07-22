import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import EpsagonDocumentLoadInstrumentation from '../src/instrumentation/documentLoadInstrumentation';
import EpsagonExporter from '../src/exporter';

const chai = require('chai');
const sinon = require('sinon');
const helper = require('./helper');

helper.browserenv();
const sandbox = sinon.createSandbox();

const entries = {
  connectEnd: 17.90000000037253,
  connectStart: 17.90000000037253,
  domComplete: 1131.0999999996275,
  domContentLoadedEventEnd: 586.6999999992549,
  domContentLoadedEventStart: 586.6999999992549,
  domInteractive: 586.6999999992549,
  domainLookupEnd: 17.90000000037253,
  domainLookupStart: 17.90000000037253,
  encodedBodySize: 897,
  fetchStart: 17.90000000037253,
  loadEventEnd: 1131.2999999988824,
  loadEventStart: 1131.0999999996275,
  redirectEnd: 0,
  redirectStart: 0,
  requestStart: 36.90000000037253,
  responseEnd: 57.40000000037253,
  responseStart: 55.09999999962747,
  secureConnectionStart: 0,
  unloadEventEnd: 95.69999999925494,
  unloadEventStart: 75.40000000037253,
};

let spyEntries;
let spyExporter;
describe('docload instrumentation', () => {
  beforeEach(() => {
    Object.defineProperty(global.window.document, 'readyState', {
      writable: true,
      value: 'complete',
    });
    spyEntries = sandbox.stub(DocumentLoadInstrumentation.prototype, '_getEntries');
    spyEntries.returns(entries);
    spyExporter = sandbox.spy(EpsagonExporter.prototype, 'convert');
  });

  afterEach(() => {
    spyEntries.restore();
    spyExporter.restore();
  });

  it('should construct an instance', (done) => {
    const plugin = new EpsagonDocumentLoadInstrumentation({
      enabled: false,
    });
    chai.assert.ok(plugin instanceof EpsagonDocumentLoadInstrumentation);
    done();
  });

  it('should create span for document load', (done) => {
    setTimeout(() => {
      const spans = spyExporter.returnValues[0];
      chai.assert.ok(spans.resourceSpans[0].instrumentationLibrarySpans[0], 'spans not created');
      const span = spans.resourceSpans[0].instrumentationLibrarySpans[0];
      chai.assert.equal(span.spans.length, 1, 'more then one doc load span being created');
      chai.assert.equal(span.spans[0].name, '/', 'Span name was not converted to path name');
      const typeObj = span.spans[0].attributes.filter((obj) => obj.key === 'type');
      const operationObj = span.spans[0].attributes.filter((obj) => obj.key === 'operation');
      chai.assert.equal(typeObj[0].value.stringValue, helper.type.DOC, 'incorrect doc load type');
      chai.assert.equal(operationObj[0].value.stringValue, helper.operations.LOAD, 'incorrect doc load operation');
      done();
    }, 5000);
  }).timeout(6000);

  it('should add error to parent load span', (done) => {
    window.dispatchEvent(
      new window.CustomEvent('load', {
        bubbles: true,
        cancelable: false,
        composed: true,
        detail: {},
      }),
    );
    helper.createError();
    setTimeout(() => {
      const spans = spyExporter.returnValues[0];
      chai.assert.ok(spans.resourceSpans[0].instrumentationLibrarySpans[0], 'spans not created');
      const span = spans.resourceSpans[0].instrumentationLibrarySpans[0];
      chai.assert.equal(span.spans.length, 1, 'more then one doc load span being created');
      chai.assert.equal(span.spans[0].name, '/', 'Span name was not converted to path name');
      chai.assert.equal(span.spans[0].events[0].name, 'exception', 'Error not added as event on doc load span');
      chai.assert.deepEqual(span.spans[0].events[0].attributes[0], { key: 'exception.message', value: { stringValue: 'my error' } }, 'exception didnt capture error message');
      const typeObj = span.spans[0].attributes.filter((obj) => obj.key === 'type');
      const operationObj = span.spans[0].attributes.filter((obj) => obj.key === 'operation');
      chai.assert.equal(typeObj[0].value.stringValue, helper.type.DOC, 'incorrect doc load type');
      chai.assert.equal(operationObj[0].value.stringValue, helper.operations.LOAD, 'incorrect doc load operation');
      done();
    }, 5500);
  }).timeout(6000);

  it('should send error span as doc load if no parent span', (done) => {
    helper.createError();
    setTimeout(() => {
      const spans = spyExporter.returnValues[0];
      chai.assert.ok(spans.resourceSpans[0].instrumentationLibrarySpans[0], 'spans not created');
      const span = spans.resourceSpans[0].instrumentationLibrarySpans[0];
      chai.assert.equal(span.spans.length, 1, 'more then one doc load span being created');
      chai.assert.equal(span.spans[0].name, '/', 'Span name was not converted to path name');
      chai.assert.equal(span.spans[0].events[0].name, 'exception', 'Error not added as event on doc load span');
      chai.assert.deepEqual(span.spans[0].events[0].attributes[0], { key: 'exception.message', value: { stringValue: 'my error' } }, 'exception didnt capture error message');
      const typeObj = span.spans[0].attributes.filter((obj) => obj.key === 'type');
      const operationObj = span.spans[0].attributes.filter((obj) => obj.key === 'operation');
      chai.assert.equal(typeObj[0].value.stringValue, helper.type.DOC, 'incorrect doc load type');
      chai.assert.equal(operationObj[0].value.stringValue, helper.operations.LOAD, 'incorrect doc load operation');
      done();
    }, 5500);
  }).timeout(6000);
});

after(() => sandbox.restore());
