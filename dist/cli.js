#!/usr/bin/env node
import meow from 'meow';
const cli = meow(`
	Usage
	  $ bakahttp

	Options
	  --256  Check for 256 color support
	  --16m  Check for 16 million color support

	Examples
	  $ bakahttp
	  $ bakahttp --256
	  $ bakahttp --16m

	Exits with code 0 if color is supported and 1 if not
`);

const {flags} = cli;
const level = flags['256'] ? 'has256' : (flags['16m'] ? 'has16m' : 'hasBasic');

console.log('hello world');
console.log(level);
console.log('\n// dist/cli.js');


