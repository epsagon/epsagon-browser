
<p align="center">
  <a href="https://epsagon.com" target="_blank" align="center">
    <img src="https://cdn2.hubspot.net/hubfs/4636301/Positive%20RGB_Logo%20Horizontal%20-01.svg" width="300">
  </a>
  <br />
</p>


# Epsagon Tracing for Web

This package provides tracing to front end of web applications for the collection of distributed tracing and performance metrics in [Epsagon](https://app.epsagon.com/?utm_source=github).

## Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Custom Tags](#custom-tags)
- [Configuration](#configuration)
  - [Trace Header Propagation](#trace-header-propagation)
- [FAQ] (#faq)
- [Getting Help](#getting-help)
- [Opening Issues](#opening-issues)
- [License](#license)

## Installation

To install Epsagon, simply run:
```sh
npm install @epsagon/web --save
```

## Usage

To initialize the tracer, import the SDK and call the init function before the start of your project.

```javascript
import epsagon from '@epsagon/web'

epsagon.init({
  token: 'epsagon-token',
  appName: 'app-name-stage',
})
```

## Custom Tags

To add additional information to spans there are two methods available. Batch add user identity information with the ```epsagon.identity``` function, or use the ```epsagon.tag``` function to add your own custom information.

Options for ```epsagon.identify``` include { userId, userName, userEmail, companyId, companyName }.

```js
epsagon.identify({
  userId: '7128f1a08a95e46c', 
  userName: 'John Doe', 
  userEmail: 'john@doe.com',
  companyId: 'fcffa7328813e4', 
  companyName: 'Epsagon'
})

```

Custom tags can only be added one at a time by passing a key and value to the tag function.

```js
epsagon.tag('PurchaseId', '2ef5b4bfdd')
```

## Configuration

Advanced options can be configured as a parameter to the init() method.

|Parameter          |Type   |Default      |Description                                                                        |
|-------------------|-------|-------------|-----------------------------------------------------------------------------------|
|token              |String |-            |Epsagon account token                                                              |
|appName            |String |`Epsagon Application`|Application name that will be set for traces                                       |
|collectorURL       |String |-|The address of the trace collector to send trace to                                       |
|metadataOnly       |Boolean|`false`       |Whether to send only the metadata (`true`) or also the payloads (`false`)          |
|propagateTraceHeaderUrls       |Array|`*`       |Which outgoing requests to add traceparent headers to. Defaults to all.          |
|isEpsagonDisabled       |Boolean|`false`       |A flag to completely disable Epsagon (can be used for tests or locally)         |


### Trace Header Propagation
By default all outgoing requests will be added with a `traceparent` header which allows Epsagon to connect the front end trace to the backend traces. Some external services will not accept a traceparent header on request. If you need to limit the traceparent headers to requests to internal services, pass in an array of the hosts you do want to connect to in the propagateTraceHeaderUrls param in the config.

```javascript
import epsagon from '@epsagon/web'

epsagon.init({
  token: 'epsagon-token',
  appName: 'app-name-stage',
  propagateTraceHeaderUrls: ['localhost', 'sub.example.com']
})
```

## FAQ
**Question:** I'm getting CORS errors in my application.

**Answer:** epsagon-browser adds `traceparent` HTTP header to all outgoing HTTP calls. You should make sure your backend accepts this header. If you are using 3rd party services, you can use `propagateTraceHeaderUrls` parameter to only add the header to your urls.

## Getting Help

If you have any issue around using the library or the product, please don't hesitate to:

* Use the [documentation](https://docs.epsagon.com).
* Use the help widget inside the product.
* Open an issue in GitHub.


## Opening Issues

If you encounter a bug with the Epsagon library, we want to hear about it.

When opening a new issue, please provide as much information about the environment:
* Library version, Node.js runtime version, dependencies, etc.
* Snippet of the usage.
* A reproducible example can really help.

The GitHub issues are intended for bug reports and feature requests.
For help and questions about Epsagon, use the help widget inside the product.


## License

Provided under the MIT license. See LICENSE for details.

Copyright 2021, Epsagon

