import ReactRedirectInstrumentation from './instrumentation/redirectInstrumentation';

const webInit = require('@epsagon/web').init;
export {identify, tag} from '@epsagon/web';

// to pass into the init - app_name: str, token: str
function init(configData) {
  const { tracer, epsSpan } = webInit(configData);

  if (configData.history) {
    ReactRedirectInstrumentation(configData.history, tracer, epsSpan);
  }

  return tracer;
}

export { init };
