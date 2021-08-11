import ReactRedirectInstrumentation from './instrumentation/redirectInstrumentation';

const epsagon = require('@epsagon/web');

const webInit = epsagon.init;
const { identifY, tag } = epsagon;

function init(configData) {
  const { tracer, epsSpan } = webInit(configData);

  if (configData.history) {
    ReactRedirectInstrumentation(configData.history, tracer, epsSpan);
  }

  return tracer;
}

export { init, identifY, tag };
