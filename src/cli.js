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
    --concurrent, -c <num> 设置最大并发数
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
    },
    task: {
      type: 'string',
      shortFlag: 't',
      default: 'tease'
    },
  }
});

let taskName = cli.flags.task;
// let taskModule = await loadTask(taskName);
// let taskClass =  taskModule.default 
// let taskClass =  SleepTask;
/**
 * @type {typeof BaseTask}
 */
let taskClass =  (await import(`./tasks/${cli.flags.task}.js`)).default;
await taskClass.parseArgs(cli.input, cli.flags);
let bk = new Baka(taskClass, {})
render(<App baka={bk} />);
await bk.init();
bk.start();


