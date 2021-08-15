import ReactRedirectInstrumentation from './instrumentation/redirectInstrumentation';

const epsagon = require('@epsagon/web');

const epsagonInit = epsagon.init;
const { identify, tag } = epsagon;

function init(configData) {
  const { tracer, epsSpan } = epsagonInit(configData);

  if (configData.history) {
    ReactRedirectInstrumentation(configData.history, tracer, epsSpan);
  }

  return tracer;
}

export { init, identify, tag };
