
<p align="center">
  <a href="https://epsagon.com" target="_blank" align="center">
    <img src="https://cdn2.hubspot.net/hubfs/4636301/Positive%20RGB_Logo%20Horizontal%20-01.svg" width="300">
  </a>
  <br />
</p>

# Epsagon Tracing for Web

![Trace](trace.png)


This package provides tracing to front end of web applications for the collection of distributed tracing and performance metrics in [Epsagon](https://app.epsagon.com/?utm_source=github).

## Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Auto-tracing](#auto-tracing)
  - [Calling the SDK](#calling-the-sdk)
- [Configuration](#configuration)
- [Getting Help](#getting-help)
- [Opening Issues](#opening-issues)
- [License](#license)

## Installation

To install Epsagon, simply run:
```sh
npm install @epsagon/react
```

## Usage

To initialize the tracer, import the sdk and call the init function before the start of your project.

```javascript
const Epsagon = require('@epsagon/react')

Epsagon.init({
	app_name: 'app-name-stage',
	token: 'epsagon-token',
})
```

## Configuration

Advanced options can be configured as a parameter to the init() method.

|Parameter          |Type   |Default      |Description                                                                        |
|-------------------|-------|-------------|-----------------------------------------------------------------------------------|
|token              |String |-            |Epsagon account token                                                              |
|app_name            |String |`epsagon trace`|Application name that will be set for traces                                       |
|metadataOnly       |Boolean|`true`       |Whether to send only the metadata (`true`) or also the payloads (`false`)          |
|propagateTraceHeaderUrls       |Array|       |Which outgoing requests to add traceparent headers to. Defaults to all.          |
|isEpsagonDisabled       |Boolean|`false`       |Disables tracing         |

### propagateTraceHeaderUrls
By default all outgoing requests recieve a traceparent header which allows Epsagon to connect the front end trace to the backend traces. Some external services will not accept a traceparent header on request. If you need to limit the traceparent headers to requests to internal services, pass in an array of the hosts you do want to connect to in the propagateTraceHeaderUrls param in the config.

```javascript
const Epsagon = require('@epsagon/react')

Epsagon.init({
	app_name: 'app-name-stage',
	token: 'epsagon-token',
  propagateTraceHeaderUrls: ['localhost', 'jsonplaceholder.typicode.com']
})
```

## Setting Custom Span Tags

To add additional information to spans there are two methods available. Batch add user identity information with the ```Epsagon.identity``` function, or use the ```Epsagon.tag``` function to add your own custom information.

Options for ```Epsagon.identify``` include { userId, name, email, companyId, companyName }.

```js
const options = {
	userId: 'testuser', 
	email: 'test email',
	name: 'test name', 
	companyId: 'company id test', 
	companyName: 'company name'
}

Epsagon.identify(options)

```

Custom tags can only be added one at a time by passing a key and value to the tag function.

```js
Epsagon.tag('tag name', 'tag value')
```

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

