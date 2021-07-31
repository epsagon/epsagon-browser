import ReactRedirectInstrumentation from './instrumentation/redirectInstrumentation';

const webInit = require('@epsagin/nodejs').init;
export {identify, tag} from '@epsagin/nodejs';

function init(configData) {
  const { tracer, epsSpan } = webInit(configData);

  if (configData.history) {
    ReactRedirectInstrumentation(configData.history, tracer, epsSpan);
  }

  return tracer;
}

export { init };
