import EpsagonDocumentLoadInstrumentation from '../src/instrumentation/documentLoadInstrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import EpsagonExporter from '../src/exporter';

const helper = require('./helper');
const chai = require('chai');
const sinon = require('sinon');

helper.browserenv()
let sandbox = sinon.createSandbox();
const operations = {
  LOAD: 'page_load'
}
const type = {
  DOC: 'browser'
}

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
  unloadEventStart: 75.40000000037253
};

let spyEntries;
describe('docload instrumentation', () => {
  beforeEach(() => {
    Object.defineProperty(global.window.document, 'readyState', {
      writable: true,
      value: 'complete',
    });
    spyEntries = sandbox.stub(DocumentLoadInstrumentation.prototype, '_getEntries')
    spyEntries.returns(entries)
  });

  afterEach(() => {
    spyEntries.restore();
  })

  it('should construct an instance', () => {
    let plugin = new EpsagonDocumentLoadInstrumentation({
      enabled: false,
    });
    chai.assert.ok(plugin instanceof EpsagonDocumentLoadInstrumentation);
  });

  it('should create span', done => {
    let spyExporter = sandbox.spy(EpsagonExporter.prototype, 'convert');
    // window.dispatchEvent(
    //   new window.CustomEvent('load', {
    //     bubbles: true,
    //     cancelable: false,
    //     composed: true,
    //     detail: {},
    //   })
    // );

    setTimeout(() => {
      let spans = spyExporter.returnValues[0];
      chai.assert.ok(spans.resourceSpans[0]['instrumentationLibrarySpans'][0], 'spans not created');
      let span = spans.resourceSpans[0]['instrumentationLibrarySpans'][0];
      chai.assert.equal(span.spans.length, 1, 'more then one doc load span being created');
      chai.assert.equal(span.spans[0].name, '/', 'Span name was not converted to path name');
      let typeObj = span.spans[0].attributes.filter((obj)=> {
        return obj.key ==='type';
      })
      let operationObj = span.spans[0].attributes.filter((obj)=> {
        return obj.key ==='operation';
      })
      chai.assert.equal(typeObj[0].value.stringValue, type.DOC, 'incorrect doc load type');
      chai.assert.equal(operationObj[0].value.stringValue, operations.LOAD, 'incorrect doc load operation');
      done();
    }, 5000);
  }).timeout(6000);

  //   it('init function produces tracer and epsSpan', () => {
  //     let res = epsagon.init({ 'token': 'fasdfsafa', appName: appName });
  //     chai.assert.exists(res.tracer, 'tracer was created');
  //     chai.assert.exists(res.epsSpan, 'epsSpan was created');
  //     chai.assert.equal(res.tracer.instrumentationLibrary.name, appName, 'app name should be passed into tracer');
  //     chai.assert.exists(res.epsSpan.currentSpan, 'current span should have been created')
  //   });

  //   it('init function returns if no token passed in', () => {
  //     let res = epsagon.init({ appName: appName });
  //     chai.assert.notExists(res, 'res should be false');
  //   });

  //   it('init function returns if epsagon disabled', () => {
  //     let res = epsagon.init({ 'token': 'fasdfsafa', appName: appName, isEpsagonDisabled: true });
  //     chai.assert.notExists(res, 'res should be false');
  //   });

});

// describe('DocumentLoad Instrumentation', () => {
//     let plugin: DocumentLoadInstrumentation;
//     let contextManager: StackContextManager;
// const sandbox = sinon.createSandbox();

// beforeEach(() => {
//   contextManager = new StackContextManager().enable();
//   context.setGlobalContextManager(contextManager);
//   Object.defineProperty(window.document, 'readyState', {
//     writable: true,
//     value: 'complete',
//   });
//   sandbox.replaceGetter(navigator, 'userAgent', () => userAgent);
//   plugin = new DocumentLoadInstrumentation({
//     enabled: false,
//   });
//   plugin.setTracerProvider(provider);
//   exporter.reset();
// });

// afterEach(async () => {
//   sandbox.restore();
//   context.disable();
//   Object.defineProperty(window.document, 'readyState', {
//     writable: true,
//     value: 'complete',
//   });
//   plugin.disable();
// });

// before(() => {
//   propagation.setGlobalPropagator(new HttpTraceContextPropagator());
// });


// describe('when document readyState is complete', () => {
//   let spyEntries: any;
//   beforeEach(() => {
//     spyEntries = sandbox.stub(window.performance, 'getEntriesByType');
//     spyEntries.withArgs('navigation').returns([entries]);
//     spyEntries.withArgs('resource').returns([]);
//     spyEntries.withArgs('paint').returns([]);
//   });
//   afterEach(() => {
//     spyEntries.restore();
//   });
//   it('should start collecting the performance immediately', done => {
//     plugin.enable();
//     setTimeout(() => {
//       assert.strictEqual(window.document.readyState, 'complete');
//       assert.strictEqual(spyEntries.callCount, 3);
//       done();
//     });
//   });
// });


after(() => sandbox.restore());