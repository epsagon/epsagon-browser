# Epsagon React Tracing

The Epsagon react tracing module is created to provide front end automated instrumentation to react apps. This package extends the Epsagon web tracing module that provides tracing and instrumentation for document load events, and http requests sent through xmlhttp or fetch and introduces additional redirect instrumentation.

## Set Up

```bash
npm install --save ep-react-logs
```

```jsx
import React, { Component } from 'react'
import { createBrowserHistory } from 'history';
const Epsagon = require('ep-react-logs')
const history = createBrowserHistory();

Epsagon.init({
	app_name: 'app name',
	token: 'epsagon token',
	history: history
})

ReactDOM.render(
		<Router history={history}>
			<main>
				<Route exact path='/' component={Home}/>
				<Route exact path='/test' component={Content}/>
			</main>
		</Router>

,document.getElementById('root'));
```
