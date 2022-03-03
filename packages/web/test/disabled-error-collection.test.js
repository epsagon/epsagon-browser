import EpsagonDocumentLoadInstrumentation from '../src/instrumentation/documentLoadInstrumentation';

const chai = require('chai');
const sinon = require('sinon');
const helper = require('./helper');
const epsagon = require('../src/web-tracer');

const sandbox = sinon.createSandbox();
let spyCreateSpan;

describe('Error Collection', () => {
  beforeEach(() => {
    helper.browserenv({errorDisabled: true});
    spyCreateSpan = sandbox.spy(EpsagonDocumentLoadInstrumentation.prototype, 'reportError');

    Object.defineProperty(global.window.document, 'readyState', {
      writable: true,
      value: 'complete',
    });
  });

  afterEach(() => {
    spyCreateSpan.restore();
  });

  it('should not create a span for a raised error', (done) => {
    epsagon.init({isTest: true, token: 'abcdef', errorDisabled: true})
    helper.createError();
    setTimeout(() => {
      chai.expect(spyCreateSpan.callCount).to.equal(0);
      done();
    }, 0);
  });
});
