import { BatchSpanProcessor } from '@opentelemetry/tracing';
import { WebTracerProvider } from '@opentelemetry/web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import EpsagonFetchInstrumentation from './instrumentation/fetchInstrumentation';
import EpsagonXMLHttpRequestInstrumentation from './instrumentation/xmlHttpInstrumentation';
import EpsagonDocumentLoadInstrumentation from './instrumentation/documentLoadInstrumentation'
import EpsagonExporter from './exporter';
const {CompositePropagator, HttpTraceContextPropagator} = require("@opentelemetry/core")
const parser = require('ua-parser-js');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');

class EpsagonSpan {

  timeout = 30000

  constructor(tracer){
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
  }

  get currentSpan(){
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

//to pass into the init - app_name: str, token: str
function init (configData) {

  if(!configData.app_name){
    configData.app_name = 'epsagon trace';
  } 

  if(!configData.token){
    console.log('Epsagon token must be passed into initialization')
    return
  }

  if(!configData.url){
    configData.url = 'https://opentelemetry.tc.epsagon.com/traces';
  }

  const collectorOptions = {
    serviceName: configData.app_name,
    url: configData.url,
    headers: {
      "X-Epsagon-Token": `${configData.token}`,
    },
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

  const tracer = provider.getTracer(configData.app_name);  
  let epsSpan = new EpsagonSpan(tracer);

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new EpsagonDocumentLoadInstrumentation(epsSpan),
      new EpsagonFetchInstrumentation(epsSpan),
      new EpsagonXMLHttpRequestInstrumentation({      
          propagateTraceHeaderCorsUrls: /.+/,
        }, epsSpan)
    ],
  });

  return { tracer, epsSpan};
}

export { init }
