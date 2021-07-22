import ReactRedirectInstrumentation from './instrumentation/redirectInstrumentation';

const webInit = require('@epsagon/web').init;
export {identify, tag} from '@epsagon/web';

function init(configData) {
  const { tracer, epsSpan } = webInit(configData);

  if (configData.history) {
    ReactRedirectInstrumentation(configData.history, tracer, epsSpan);
  }

  return tracer;
}

export { init };
