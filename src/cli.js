#!/usr/bin/env node
import fs from 'fs/promises';
import meow from 'meow';
import React from 'react';
import { render } from 'ink';
import App from './view.js';
// import SleepTask from './tasks/sleep.js';
// import TeaseTask from './tasks/tease.js';
import BaseTask from './tasks/base.js';
// import pkg from '../package.json' with  { type: 'json' };
// import { loadTask } from './services.js';
import Baka from './baka.js';

const pkg = JSON.parse(
  await fs.readFile(new URL('../package.json', import.meta.url), 'utf-8')
);

const cli = meow(`
  Usage
    $ ${pkg.name} [options] [args]

  Options
    -c, --concurrent <num>  Set concurrent workers (default: 16)
    -d, --delay <min[-max]> Delay between cycle in milliseconds (default: 1-3)
    -u, --unit <min[-max]>  Requests per cycle (default: 1)
    -H, --header <k:v>      Add custom request header (repeatable)
    -C, --cookies <file>    Load cookies.txt or cookies.json  from file
    -b, --body <file>       File to use as request body
    -m, --method <name>     HTTP method to use (default: GET; POST if has body)
    -p, --proxy <url>       Proxy server to use (http/socks5)
    -r, --run <task>        Task to run (default: tease)
    -s, --silent            Suppress output logging
    -o, --out <dir>         [?]Output directory for results
        --out-stats <file>  File to save statistics
        --out-log <file>    [?]File to save log
        --http2             Use HTTP/2 protocol
    -h, --help              Show this help
    -v, --version           Show version

  Arguments
    1      Target URL with placeholder markers
    ...    Replacement rules for URL placeholders

  Examples
    $ ${pkg.name} -c 16 \\
      https://example.com/?id={}&user={}&t={} \\
      1- 1: ts
`, {
  importMeta: import.meta,
  flags: {
    concurrent: {
      type: 'number',
      shortFlag: 'c',
      default: 16
    },
    delay: {
      type: 'string',
      shortFlag: 'd',
      default: '1-3'
    },
    unit: {
      type: 'string',
      shortFlag: 'u',
      default: '1'
    },
    header: {
      type: 'string',
      shortFlag: 'H',
      isMultiple: true
    },
    cookies: {
      type: 'string',
      shortFlag: 'C'
    },
    body: {
      type: 'string',
      shortFlag: 'b'
    },
    method: {
      type: 'string',
      shortFlag: 'm',
      default: 'GET'
    },
    proxy: {
      type: 'string',
      shortFlag: 'p'
    },
    run: {
      type: 'string',
      shortFlag: 'r',
      default: 'tease'
    },
    silent: {
      type: 'boolean',
      shortFlag: 's'
    },
    out: {
      type: 'string',
      shortFlag: 'o'
    },
    outStats: {
      type: 'string'
    },
    outLog: {
      type: 'string'
    },
    http2: {
      type: 'boolean'
    },
    help: {
      type: 'boolean',
      shortFlag: 'h'
    },
    version: {
      type: 'boolean',
      shortFlag: 'v'
    }
  }
});


if (cli.flags.body && cli.flags.method == 'GET') {
  cli.flags.method = 'POST'
}

/**
 * @type {typeof BaseTask}
 */
let taskClass
let load_err = null
try {
  taskClass = (await import(`./tasks/${cli.flags.run}.js`)).default;
} catch (e) {
  load_err = e
}

if (taskClass) {
  await taskClass.parseArgs(cli.input, cli.flags);
  /** @type {typeof taskClass.config} */
  let overConfig = {
    maxConcurrent: flags.concurrent
  }
  let bk = new Baka(taskClass, overConfig)
  cli.flags.silent || render(<App baka={bk} />);
  await bk.init();
  bk.start();
} else {
  if (cli.flags.run == '504') {
    (await import('./504server.js')).default()
  } else {
    console.log(load_err);
  }
}



