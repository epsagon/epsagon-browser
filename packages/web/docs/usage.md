# Epsagon Web Tracing

The epsagon web tracing module is created to provide front end automated instrumentation to web apps built using nodejs. This package provides tracing and instrumentation for document load events, and http requests sent through xmlhttp or fetch. It then customizes the traces for epsagon specifications before sending to the Epsagon backend.

## Set Up

```bash
npm install --save ep-react-logs
```

```js
const Epsagon = require('ep-react-logs')

Epsagon.init({
	app_name: 'app name',
	token: 'token string',
})
```

