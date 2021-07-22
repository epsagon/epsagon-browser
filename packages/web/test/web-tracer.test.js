const chai = require('chai');
const epsagon = require('../src/web-tracer');
const helper = require('./helper');

before(helper.browserenv);
const appName = 'test app';

describe('init tests', () => {
  it('init function exists', (done) => {
    chai.expect(typeof epsagon.init === 'function').to.equal(true);
    done();
  });

  it('init function produces tracer and epsSpan', (done) => {
    const res = epsagon.init({ token: 'fasdfsafa', appName, isTest: true });
    chai.assert.exists(res.tracer, 'tracer was created');
    chai.assert.exists(res.epsSpan, 'epsSpan was created');
    chai.assert.equal(res.tracer.instrumentationLibrary.name, appName, 'app name should be passed into tracer');
    chai.assert.exists(res.epsSpan.currentSpan, 'current span should have been created');
    done();
  });

  it('init function returns if no token passed in', (done) => {
    const res = epsagon.init({ appName, isTest: true });
    chai.assert.notExists(res, 'res should be false');
    done();
  });

  it('init function returns if epsagon disabled', (done) => {
    const res = epsagon.init({
      token: 'fasdfsafa', appName, isEpsagonDisabled: true, isTest: true,
    });
    chai.assert.notExists(res, 'res should be false');
    done();
  });
});

describe('tags tests', () => {
  it('identify adds tags to epsSpan', (done) => {
    const options = {
      userId: 'test user',
      name: 'test name',
      email: 'test email',
      companyId: 'company id test',
      companyName: 'company name',
    };
    const res = epsagon.init({ token: 'fasdfsafa', appName, isTest: true });
    chai.assert.exists(res.epsSpan, 'epsSpan was created');
    chai.assert.exists(res.epsSpan.currentSpan, 'current span should have been created');
    epsagon.identify(options);
    chai.assert.exists(res.epsSpan.identifyFields, 'identity fields should have been added to epsspan');
    chai.assert.deepEqual(res.epsSpan.identifyFields, options, 'identity fields should equal passed in fields');
    done();
  });

  it('tags adds to epsSpan', (done) => {
    const sampleKey = 'sample key';
    const sampleValue = 'sample value';
    const res = epsagon.init({ token: 'fasdfsafa', appName, isTest: true });
    chai.assert.exists(res.epsSpan, 'epsSpan was created');
    chai.assert.exists(res.epsSpan.currentSpan, 'current span should have been created');
    epsagon.tag(sampleKey, sampleValue);
    chai.assert.exists(res.epsSpan.tags, 'tag should have been added to epsspan');
    chai.assert.deepEqual(res.epsSpan.tags, { [sampleKey]: sampleValue }, 'tag should equal passed in fields');
    done();
  });
});

after(helper.restore);
