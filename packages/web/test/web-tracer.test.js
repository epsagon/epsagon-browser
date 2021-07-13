const epsagon = require('../src/web-tracer');
const helper = require('./helper')
const chai = require('chai');

before(helper.browserenv);
let appName = 'test app';

describe('init tests', () => {

  it('init function exists', () => {
    chai.expect(typeof epsagon.init === 'function').to.equal(true);
  });

  it('init function produces tracer and epsSpan', () => {
    let res = epsagon.init({ 'token': 'fasdfsafa', appName: appName });
    chai.assert.exists(res.tracer, 'tracer was created');
    chai.assert.exists(res.epsSpan, 'epsSpan was created');
    chai.assert.equal(res.tracer.instrumentationLibrary.name, appName, 'app name should be passed into tracer');
    chai.assert.exists(res.epsSpan.currentSpan, 'current span should have been created')
  });

  it('init function returns if no token passed in', () => {
    let res = epsagon.init({ appName: appName });
    chai.assert.notExists(res, 'res should be false');
  });

  it('init function returns if epsagon disabled', () => {
    let res = epsagon.init({ 'token': 'fasdfsafa', appName: appName, isEpsagonDisabled: true });
    chai.assert.notExists(res, 'res should be false');
  });

});

describe('tags tests', () => {

  it('identify adds tags to epsSpan', () => {
    let options = {
      userId: 'test user', 
      name: 'test name', 
      email: 'test email',
      companyId: 'company id test', 
      companyName: 'company name'
    }
    let res = epsagon.init({ 'token': 'fasdfsafa', appName: appName });
    chai.assert.exists(res.epsSpan, 'epsSpan was created');
    chai.assert.exists(res.epsSpan.currentSpan, 'current span should have been created')
    epsagon.identify(options);
    chai.assert.exists(res.epsSpan.identifyFields, 'identity fields should have been added to epsspan');
    chai.assert.deepEqual(res.epsSpan.identifyFields, options, 'identity fields should equal passed in fields');
  });

  it('tags adds to epsSpan', () => {
    let sampleKey = 'sample key';
    let sampleValue = 'sample value';
    let res = epsagon.init({ 'token': 'fasdfsafa', appName: appName });
    chai.assert.exists(res.epsSpan, 'epsSpan was created');
    chai.assert.exists(res.epsSpan.currentSpan, 'current span should have been created')
    epsagon.tag(sampleKey, sampleValue);
    chai.assert.exists(res.epsSpan.tags, 'tag should have been added to epsspan');
    chai.assert.deepEqual(res.epsSpan.tags, {[sampleKey]: sampleValue}, 'tag should equal passed in fields');
  });

});


after(helper.restore);
