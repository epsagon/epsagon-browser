# Epsagon Exporter

The Epsagon exporter extends opentelemtry's exporter but customizes the data to Epsagon specifications before it send the data out. This includes updating the event names, types, operations and adding non-event specific data such as user agent data and current url data. 

To add more data to the spans before they are sent out, it must be added to the end of either the current resource attributes or the span attributes, with the attribute name, type and value set.

```js
attributesLength ++
spanAttributes[attributesLength] = { key: 'attribute name', value: {stringValue: 'attribute value'}}

resourcesLength ++
convertedSpans.resourceSpans[0].resource.attributes[resourcesLength] = { key: 'attribute name', value: {stringValue: 'attribute value'}}
```

Data such as where the exporter sends the spans can be customized in the init function of the web-tracer file.
