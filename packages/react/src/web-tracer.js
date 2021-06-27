import ReactRedirectInstrumentation from './instrumentation/redirectInstrumentation';

const Epsagon = require('@epsagon/web');

// to pass into the init - app_name: str, token: str
function init(configData) {
  const { tracer, epsSpan } = Epsagon.init(configData);

  if (configData.history) {
    ReactRedirectInstrumentation(configData.history, tracer, epsSpan);
  }

  return tracer;
}

export { init };
