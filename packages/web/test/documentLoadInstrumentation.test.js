import EpsagonDocumentLoadInstrumentation from '../src/instrumentation/documentLoadInstrumentation';
const epsagon = require('../src/web-tracer');
const helper = require('./helper');
const chai = require('chai');
const sinon = require('sinon');

before(helper.browserenv);
let sandbox = sinon.createSandbox();

describe('docload instrumentation', () => {
    beforeEach(() => {
        let res = epsagon.init({token: 'dfsaf'});
        Object.defineProperty(window.document, 'readyState', {
          writable: true,
          value: 'complete',
        });
      });
    
      afterEach(async () => {
        Object.defineProperty(window.document, 'readyState', {
          writable: true,
          value: 'complete',
        });
      });

      describe('constructor', () => {
        it('should construct an instance', () => {
          let plugin = new EpsagonDocumentLoadInstrumentation({
            enabled: false,
          });
          chai.assert.ok(plugin instanceof EpsagonDocumentLoadInstrumentation);
        });
      });
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