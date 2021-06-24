# Epsagon Instrumentations

The base web instrumentations are based on opentelemetry's web instrumentations. In order to send additional data to what opentelemetry send by default, some instrumentations are extended in the instrumentation folder. Currently we are grabbing extra data from both the request and the response and adding them as additional span attributes. 

To add more span attributes before it gets sent to the exporter, use the ```span.setAttribute()``` function.

```js
span.setAttribute('http.response.body', (await resCopy.text()).substring(0, 5000));
```

