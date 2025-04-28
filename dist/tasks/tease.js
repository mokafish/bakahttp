import got from 'got';
import { SocksProxyAgent } from 'socks-proxy-agent';
import BaseTask from './base.js';
let param = {
  url: 'http://httpbin.org/ip',
  proxy: false,
  _raw: []
};
let global_request_option = {};

/**
 * @typedef {import('./tasks/base.js').TaskConfig} TaskConfig
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
    this.title = `tease_${this.tid}  proxy:${param.proxy}`;
  }
  async init() {
    // 在这里生成任务的需要的数据
    this.props = {
      url: 'http://httpbin.org/ip'
    };
  }
  async run() {
    let data = await got.get(this.props.url, {
      ...global_request_option
    }).json();
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });
    this.title = `tease_${this.tid} => ${data?.origin}`;
    this.emit('ok');
  }
  static async parseArgs(args, flags) {
    // NOTE: flag not received
    param._raw = args;
    // const proxy = 'http://localhost:8050';
    // const proxy = 'socks5://localhost:8050';
    if (flags.proxy) {
      if (flags.proxy.startsWith('socks')) {
        param.proxy = new SocksProxyAgent(proxy);
      } else if (flags.proxy.startsWith('http')) {
        param.proxy = proxy;
      }
      global_request_option.agent = {
        http: param.proxy,
        https: param.proxy,
        http2: param.proxy
      };
    }
  }
}