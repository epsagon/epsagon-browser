/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */

import { BatchSpanProcessor } from '@opentelemetry/tracing';
import { WebTracerProvider } from '@opentelemetry/web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { setGlobalErrorHandler, loggingErrorHandler, TraceIdRatioBasedSampler } from '@opentelemetry/core';
import EpsagonFetchInstrumentation from './instrumentation/fetchInstrumentation';
import EpsagonXMLHttpRequestInstrumentation from './instrumentation/xmlHttpInstrumentation';
import EpsagonDocumentLoadInstrumentation from './instrumentation/documentLoadInstrumentation';
import EpsagonExporter from './exporter';
import EpsagonUtils from './utils';
import EpsagonRedirectInstrumentation from './instrumentation/redirectInstrumentation';
import { DEFAULT_CONFIGURATIONS } from './consts';

const { CompositePropagator, HttpTraceContextPropagator } = require('@opentelemetry/core');
const parser = require('ua-parser-js');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');

let existingTracer;
let epsSpan;

class EpsagonSpan {
  constructor(tracer) {
    const span = tracer.startSpan('epsagon_init', {
      attributes: {
        operation: 'page_load',
        type: 'browser',
      },
    });
    span.setStatus({ code: 0 });
    span.end();
    this._currentSpan = span;
    this._time = Date.now();
    this.identifyFields = null;
    this.tags = {};
  }

  get currentSpan() {
    if (this._time !== null && this._time + DEFAULT_CONFIGURATIONS.pageLoadTimeout >= Date.now()) {
      return this._currentSpan;
    }
    this.currentSpan = null;
    this._time = null;
    return null;
  }

  set currentSpan(span) {
    if (span) {
      this._currentSpan = span;
      this._time = Date.now();
    }
  }
}

function identify(options) {
  if (epsSpan) {
    epsSpan.identifyFields = {
      userId: options.userId,
      userName: options.userName,
      userEmail: options.userEmail,
      companyId: options.companyId,
      companyName: options.companyName,
    };
  }
}

function tag(key, value) {
  if (epsSpan) {
    epsSpan.tags[key] = value;
  }
}

function handleLogLevel(_logLevel) {
  let logLevel;
  switch (_logLevel) {
    case 'ALL':
      logLevel = DiagLogLevel.ALL;
      break;
    case 'DEBUG':
      logLevel = DiagLogLevel.DEBUG;
      break;
    case 'INFO':
      logLevel = DiagLogLevel.INFO;
      break;
    case 'WARN':
      logLevel = DiagLogLevel.WARN;
      break;
    case 'ERROR':
      logLevel = DiagLogLevel.ERROR;
      break;
      // Default is Open Telemetry default which is DiagLogLevel.INFO
    default:
      return;
  }
  diag.setLogger(new DiagConsoleLogger(), logLevel);
}

function init(_configData) {
  const configData = _configData;

  if (configData.logLevel) {
    handleLogLevel(configData.logLevel);
  }

  // Epsagon debug overrides configData.logLevel
  if (configData.epsagonDebug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  diag.info('configData: ', configData);

  let samplingRatio = DEFAULT_CONFIGURATIONS.networkSamplingRatio;

  if (configData.networkSamplingRatio || configData.networkSamplingRatio === 0) {
    samplingRatio = configData.networkSamplingRatio;
  }

  if (configData.isEpsagonDisabled) {
    console.log('Epsagon disabled, tracing is not running');
    return undefined;
  }

  if (existingTracer && !configData.isTest) {
    diag.info('tracer already initialized, remove duplicate initialization call');
    return undefined;
  }

  if (!configData.token) {
    console.log('Epsagon token must be passed into initialization');
    return undefined;
  }

  if (!configData.collectorURL) {
    configData.collectorURL = DEFAULT_CONFIGURATIONS.collectorURL;
  }

  const appName = configData.appName || DEFAULT_CONFIGURATIONS.appName;

  const collectorOptions = {
    serviceName: appName,
    url: configData.collectorURL,
    hosts: configData.hosts,
    headers: {
      'X-Epsagon-Token': `${configData.token}`,
    },
    metadataOnly: configData.metadataOnly,
  };

  const maxExportBatchSize = configData.maxBatchSize || DEFAULT_CONFIGURATIONS.maxBatchSize;
  const maxQueueSize = configData.maxQueueSize || DEFAULT_CONFIGURATIONS.maxQueueSize;
  if (maxExportBatchSize > maxQueueSize) {
    diag.error('maxExportBatchSize cannot be bigger than maxQueueSize, could not start Epsagon');
    return undefined;
  }

  const batchProcessorConfig = {
    maxExportBatchSize,
    maxQueueSize,
    scheduledDelayMillis: configData.scheduledDelayMillis || DEFAULT_CONFIGURATIONS.scheduledDelayMillis,
    exportTimeoutMillis: configData.exportTimeoutMillis || DEFAULT_CONFIGURATIONS.exportTimeoutMillis,
  };

  setGlobalErrorHandler(loggingErrorHandler());

  const provider = new WebTracerProvider({ sampler: new TraceIdRatioBasedSampler(samplingRatio) });

  /* eslint-disable no-undef */
  const userAgent = parser(navigator.userAgent);

  const exporter = new EpsagonExporter(collectorOptions, userAgent);

  provider.addSpanProcessor(new BatchSpanProcessor(exporter, batchProcessorConfig));

  provider.register({
    contextManager: new ZoneContextManager(),
    propagator: new CompositePropagator({
      propagators: [
        new HttpTraceContextPropagator(),
      ],
    }),
  });

  const tracer = provider.getTracer(appName);
  existingTracer = true;
  epsSpan = new EpsagonSpan(tracer);

  if (configData.isTest) {
    epsSpan.isTest = true;
  }

  let whiteListedURLsRegex;
  if (configData.propagateTraceHeaderUrls) {
    const urlsList = configData.propagateTraceHeaderUrls;
    whiteListedURLsRegex = urlsList.length > 1 ? new RegExp(urlsList.join('|')) : new RegExp(urlsList);
  } else {
    whiteListedURLsRegex = /.+/;
  }

  let blackListedURLs = [];
  if (configData.urlPatternsToIgnore) {
    blackListedURLs = configData.urlPatternsToIgnore;
    blackListedURLs.forEach((item, index, arr) => {
      // eslint-disable-next-line no-param-reassign
      arr[index] = RegExp(item);
    });
  }

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new EpsagonDocumentLoadInstrumentation(epsSpan),
      new EpsagonFetchInstrumentation({
        ignoreUrls: blackListedURLs,
        propagateTraceHeaderCorsUrls: whiteListedURLsRegex,
      }, epsSpan, { metadataOnly: configData.metadataOnly }),
      new EpsagonXMLHttpRequestInstrumentation({
        ignoreUrls: blackListedURLs,
        propagateTraceHeaderCorsUrls: whiteListedURLsRegex,
      }, epsSpan, { metadataOnly: configData.metadataOnly }),
      new EpsagonRedirectInstrumentation(tracer, epsSpan, DEFAULT_CONFIGURATIONS.redirectTimeout),
    ],
  });

  return { tracer, epsSpan };
}

export {
  init, identify, tag, EpsagonUtils,
};
