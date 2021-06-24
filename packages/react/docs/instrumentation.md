# Epsagon Instrumentation

The base web instrumentations are configured in the Epsagon js web package. In addition Epsagon's custom redirect instrumentation is configured in the instrumentation folder. 

React's synthetic events take the place of any native web events when react pages update or change routes. In order to catch the route changes, the history component must be passed into the init function and then the redirect instrumentation listens  for changes which are turned into new spans with the operation "route_change". 

To add more span attributes to the route change events before they get sent to the exporter, use the ```span.setAttribute()``` function.

```js
span.setAttribute("action", action)
```

