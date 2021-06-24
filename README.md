
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

