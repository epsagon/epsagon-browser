import { BaseOpenTelemetryComponent } from '@opentelemetry/plugin-react-load';
import ReactRedirectInstrumentation from './instrumentation/redirectInstrumentation';
const Epsagon = require('@epsagon/web')


//to pass into the init - app_name: str, token: str
function init (configData) {

  let { tracer, epsSpan } = Epsagon.init(configData);
  BaseOpenTelemetryComponent.setTracer(configData.app_name);

  if(configData.history){
    ReactRedirectInstrumentation(configData.history, tracer, epsSpan)
  }

  return tracer;
}

export { init }
