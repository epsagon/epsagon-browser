# Epsagon Web Tracing

The library is built using the opentelemetry javascript libraries. The opentelemetry functionalities as well as any custom epsagon functionalities are set up in the init function of the web-tracer file. 
Any additional instrumentations (such as user interaction) can be added there. 

```js
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new EpsagonFetchInstrumentation(),
      // new UserInteractionInstrumentation(),
      new EpsagonXMLHttpRequestInstrumentation()
    ],
  });
```

Additional data to be sent through as a header to the Epsagon backend can also be set there.

```js
  const collectorOptions = {
    serviceName: configData.app_name,
    url: configData.url,
    headers: {
      "X-Epsagon-Token": `${configData.token}`,
    },
  };
```