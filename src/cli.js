#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

import * as baka from './baka.js';

const cli = meow(
	`
		Usage
		  $ bakahttp

		Options
			--name  Your name

		Examples
		  $ bakahttp --name=Jane
		  Hello, Jane
	`,
	{
		importMeta: import.meta,
	},
);

let bk = await baka.start();
render(<App name={cli.flags.name} />);
