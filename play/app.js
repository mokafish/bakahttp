import meow from 'meow';
import fs from 'fs/promises';


const pkg = JSON.parse(
  await fs.readFile(new URL('../package.json', import.meta.url), 'utf-8')
);

const cli = meow(`
  Usage
    $ ${pkg.name} [options] [args]

  Options
    -c, --concurrent <num> 
    -d, --delay <min[-max]>
    -?, -h, --help        

  Examples
    $ ${pkg.name} -c 16 \\
      https://example.com/?id={}&user={}&t={}  \\
      1- 1: ts
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
      default: 'sleep'
    },
  }
});


console.log('** flag:')
console.log(cli.flags)
console.log('** input:')
console.log(cli.input)