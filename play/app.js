import meow from 'meow';
import fs from 'fs/promises';


const pkg = JSON.parse(
  await fs.readFile(new URL('../package.json', import.meta.url), 'utf-8')
);
const cli = meow(`
  Usage
    $ ${pkg.name} [options] [args]

  Options
    -c, --concurrent <num>  Set concurrent workers (default: 16)
    -d, --delay <min[-max]> Delay between cycle in milliseconds (default: 1-3)
    -u, --unit <min[-max]>  Requests per cycle (no delay within cycle, default: 1)
    -H, --header <k:v>      Add custom request header (repeatable)
    -C, --cookies <file>    Load cookies.txt or cookies.json  from file
    -b, --body <file>       File to use as request body
    -m, --method <name>     HTTP method to use (default: GET, POST if has body)
    -p, --proxy <url>       Proxy server to use (http/socks5)
    -r, --run <name>        Task to run (default: tease)
    -s, --silent            Suppress output logging
    -o, --out <dir>         Output directory for results -future-
        --out-stats <file>  File to save statistics
        --out-log <file>    File to save log
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
      default: 'sleep'  // debug
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


console.log('** flag:')
console.log(cli.flags)
console.log('** input:')
console.log(cli.input)