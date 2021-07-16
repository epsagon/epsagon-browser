import { BatchSpanProcessor } from '@opentelemetry/tracing';
import { WebTracerProvider } from '@opentelemetry/web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import EpsagonFetchInstrumentation from './instrumentation/fetchInstrumentation';
import EpsagonXMLHttpRequestInstrumentation from './instrumentation/xmlHttpInstrumentation';
import EpsagonDocumentLoadInstrumentation from './instrumentation/documentLoadInstrumentation'
import EpsagonExporter from './exporter';
import EpsagonUtils from './utils';
import EpsagonRedirectInstrumentation from './instrumentation/redirectInstrumentation';
const {CompositePropagator, HttpTraceContextPropagator} = require("@opentelemetry/core")
const parser = require('ua-parser-js');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');

let epsSpan;
const DEFAULT_APP_NAME = 'Epsagon Application'

class EpsagonSpan {

  timeout = 30000

  constructor(tracer) {
    let span = tracer.startSpan('epsagon_init', {
      attributes: {
        "operation": "page_load",
        "type": "browser",
      }
    });
    span.setStatus({ code: 0 });
    span.end();
    this._currentSpan = span
    this._time = Date.now()
    this.identifyFields = null;
    this.tags = {};
  }

  get currentSpan() {
    if(this._time != null && this._time + this.timeout >= Date.now()){
      return this._currentSpan
    }else {
      this.currentSpan = null
      this._time = null
      return null
    }
  }

  set currentSpan(span){
    if(span){
      this._currentSpan = span
      this._time = Date.now()
    }
  }
}

function identify(options){
  if(epsSpan){
    epsSpan.identifyFields = {
      userId: options.userId, 
      name: options.name, 
      email: options.email, 
      companyId: options.companyId, 
      companyName: options.companyName
    }
  }
}

function tag(key, value){
  if(epsSpan){
    epsSpan.tags[key] = value
  }
}

let _configData;

function init (configData) {
  console.log('initializing')
  _configData = configData;
  if (configData.isEpsagonDisabled) {
    return;
  }

  if (!configData.token) {
    console.log('Epsagon token must be passed into initialization')
    return;
  }

  if (!configData.collectorURL) {
    configData.collectorURL = 'https://opentelemetry.tc.epsagon.com/traces';
  }

  const appName = configData.appName || DEFAULT_APP_NAME;

  const collectorOptions = {
    serviceName: appName,
    url: configData.collectorURL,
    hosts: configData.hosts,
    headers: {
      "X-Epsagon-Token": `${configData.token}`,
    },
    metadataOnly: configData.metadataOnly
  };

  const provider = new WebTracerProvider();

  let userAgent = parser(navigator.userAgent);

  const exporter = new EpsagonExporter(collectorOptions, userAgent);

  provider.addSpanProcessor(new BatchSpanProcessor(exporter));

  provider.register({
    contextManager: new ZoneContextManager(),
    propagator: new CompositePropagator({
      propagators: [
        new HttpTraceContextPropagator(),     
      ], 
    }) 
  });

  const tracer = provider.getTracer(appName);
  epsSpan = new EpsagonSpan(tracer);

  let whiteListedURLsRegex;
  if(configData.propagateTraceHeaderUrls){
    let regUrlsString = ''; 
    configData.propagateTraceHeaderUrls.map((url)=> {
      regUrlsString += `${url}|`
    })
    whiteListedURLsRegex = new RegExp(regUrlsString.slice(0, -1), "i")
  }else{
    whiteListedURLsRegex = /.+/
  }

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new EpsagonDocumentLoadInstrumentation(epsSpan),
      new EpsagonFetchInstrumentation({      
        propagateTraceHeaderCorsUrls: whiteListedURLsRegex,
      }, epsSpan, {metadataOnly: configData.metadataOnly}),
      new EpsagonXMLHttpRequestInstrumentation({      
          propagateTraceHeaderCorsUrls: whiteListedURLsRegex,
        }, epsSpan, {metadataOnly: configData.metadataOnly})
    ],
  });

  const resetTimer = 3000;
  new EpsagonRedirectInstrumentation(tracer, epsSpan, resetTimer);

  return { tracer, epsSpan };
}

export { init, identify, tag, EpsagonUtils }