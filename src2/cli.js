#!/usr/bin/env node
import meow from 'meow';
import React from 'react';
import { render } from 'ink';
import App from './view.js';
import pkg from '../package.json' with  { type: 'json' };
import { loadTask } from './services.js';
import { ManagerModel } from './models.js';

// meow报错 Error: The option `alias` has been renamed to `shortFlag`. The following flags need to be updated: `--concurrent`
const cli = meow(`
  Usage
    $ ${pkg.name} <command> [options]

  Options
    --concurrent, -c  设置最大并发数
    --help            显示帮助信息

  Examples
    $ ${pkg.name} mytask -c 10
`, {
  importMeta: import.meta,
  flags: {
    concurrent: {
      type: 'number',
      shortFlag: 'c',
      default: 16
    }
  }
});

let taskName = cli.input[0] || 'sleep2';
let taskModule = await loadTask(taskName);
let taskClass =  taskModule.default 
let bakaManager = new ManagerModel(taskClass, {})
await bakaManager.initialize();
render(<App baka={bakaManager} />);