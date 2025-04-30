import got, { Options } from 'got';
import { SocksProxyAgent } from 'socks-proxy-agent';
import BaseTask from './base.js';
import { readableBytes, adaptiveToFixed } from '../util.js';
let param = {
  url: 'http://httpbin.org/ip',
  rules: [],
  proxy: false,
  _raw: []
};
let common_options = new Options({
  responseType: 'buffer'
});

/**
 * @typedef {import('./tasks/base.js').TaskConfig} TaskConfig
 */
/**
 * @typedef {import('got').Response} Response
 */

/**
 * TeaseTask
 * @extends BaseTask
 */
export default class TeaseTask extends BaseTask {
  /**
   * 任务默认配置信息
   * @static
   * @type {TaskConfig}
   */
  static config = {
    ...super.config,
    name: 'tease',
    description: 'Tease task for testing',
    maxConcurrent: 12,
    delayPlus: 500,
    checkDelay: 5000
  };
  constructor() {
    // 在这里初始化任务的基本信息
    super();
    this.title = `t_${this.tid}  proxy:${param.proxy}`;
  }
  async init() {
    // 在这里生成任务的需要的数据
    this.props = {
      url: param.url,
      headers: {
        'User-agent': 'Mozilla/5.0'
      },
      code: -1,
      len: -1
    };
  }
  async run() {
    /**@type {Response} */
    let res = await got(this.props.url, {
      method: 'GET'
    }, common_options);
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });
    this.updateUsedTime();
    this.emit('ok');
    this.props.code = res.statusCode;
    this.props.len = res.body.length;
    this.title = 't' + this.tid + ' => ' + this.props.code + ' ' + readableBytes(this.props.len);
    +' ' + adaptiveToFixed(this.used_time / 1000) + 's';
  }

  /**
   * 
   * @param {string[]} args 
   * @param {object} flags 
   */
  static async parseArgs(args, flags) {
    [param.url = 'http://httpbin.org/delay/10', ...param.rules] = args;

    // const proxy = 'http://localhost:8050';
    // const proxy = 'socks5://localhost:8050';
    if (flags.proxy) {
      if (flags.proxy.startsWith('socks')) {
        param.proxy = new SocksProxyAgent(flags.proxy);
      } else if (flags.proxy.startsWith('http')) {
        param.proxy = flags.proxy;
      }
      common_options.agent = {
        http: param.proxy,
        https: param.proxy,
        http2: param.proxy
      };
    }
  }
}