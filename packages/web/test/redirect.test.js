import EpsagonExporter from '../src/exporter';

const helper = require('./helper');
const chai = require('chai');
const sinon = require('sinon');

let epsSpan = helper.browserenv()
let sandbox = sinon.createSandbox();

let spyExporter;

describe('redirect instrumentation', () => {
  beforeEach(() => {
    Object.defineProperty(global.window.document, 'readyState', {
      writable: true,
      value: 'complete',
    });
    spyExporter = sandbox.spy(EpsagonExporter.prototype, 'convert');

  });

  afterEach(() => {
    spyExporter.restore()
  })

  it('should create span for changed path', done => {
    let oldPath = '/new-path';
    epsSpan.path = oldPath;
    setTimeout(() => {
      let spans = spyExporter.returnValues[0];
      chai.assert.ok(spans.resourceSpans[0]['instrumentationLibrarySpans'][0], 'spans not created');
      let span = spans.resourceSpans[0]['instrumentationLibrarySpans'][0];
      chai.assert.equal(span.spans.length, 1, 'more then one span being created');
      chai.assert.equal(span.spans[0].name, '/', 'Span name was not converted to path name');
      let typeObj = span.spans[0].attributes.filter((obj)=> {
        return obj.key ==='type';
      })
      let operationObj = span.spans[0].attributes.filter((obj)=> {
        return obj.key ==='operation';
      })
      let pathObj = span.spans[0].attributes.filter((obj)=> {
        return obj.key ==='previousPage';
      })
      chai.assert.equal(typeObj[0].value.stringValue, helper.type.DOC, 'incorrect redirect type');
      chai.assert.equal(operationObj[0].value.stringValue, helper.operations.ROUTE, 'incorrect operation');
      chai.assert.equal(pathObj[0].value.stringValue, oldPath, 'not logging old path correctly');
      done();
    }, 7000);
  }).timeout(8000);

  it('should create span for changed hash', done => {
    window.location.hash = '#test'
    setTimeout(() => {
      let spans = spyExporter.returnValues[0];
      chai.assert.ok(spans.resourceSpans[0]['instrumentationLibrarySpans'][0], 'spans not created');
      let span = spans.resourceSpans[0]['instrumentationLibrarySpans'][0];
      chai.assert.equal(span.spans.length, 1, 'more then one span being created');
      chai.assert.equal(span.spans[0].name, '/#test', 'Span name was not converted to path name');
      let typeObj = span.spans[0].attributes.filter((obj)=> {
        return obj.key ==='type';
      })
      let operationObj = span.spans[0].attributes.filter((obj)=> {
        return obj.key ==='operation';
      })
      let pathObj = span.spans[0].attributes.filter((obj)=> {
        return obj.key ==='previousPage';
      })
      chai.assert.equal(typeObj[0].value.stringValue, helper.type.DOC, 'incorrect redirect type');
      chai.assert.equal(operationObj[0].value.stringValue, helper.operations.ROUTE, 'incorrect operation');
      chai.assert.equal(pathObj[0].value.stringValue, '/', 'not logging old path correctly');
      done();
    }, 6000);
  }).timeout(7000);
});

after(() => sandbox.restore());