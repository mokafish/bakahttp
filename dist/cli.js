#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import App from './app.js';
const cli = meow(`
		Usage
		  $ bakahttp

		Options
			--name  Your name

		Examples
		  $ bakahttp --name=Jane
		  Hello, Jane
	`, {
  importMeta: import.meta
});
render(/*#__PURE__*/React.createElement(App, {
  name: cli.flags.name
}));