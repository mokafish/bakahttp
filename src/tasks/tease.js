import got, { Options } from 'got';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import UserAgent from 'user-agents';
import BaseTask from './base.js';
import { readableBytes, adaptiveToFixed } from '../util.js';
import PropMaker from '../propmaker.js'

// sec-ch-ua-platform: "ios"
// sec-ch-ua: "Chrome";v="123", "Not-A.Brand";v="8", "Chromium";v="123"
// sec-ch-ua-mobile: ?0
// user-agent: Mozilla/5.0
// "upgrade-insecure-requests": "1",

const COMMON_HEADERS_RAW = `
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
sec-fetch-site: same-origin
sec-fetch-mode: navigate
sec-fetch-dest: document
sec-fetch-user: ?1
accept-encoding: gzip, deflate, br, zstd
accept-language: zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6
`

let common = {
    url: 'http://httpbin.org/ip',
    rules: [],
    proxy: false,
    headers: {},
    req_opts: new Options({
        method: 'GET',
        responseType: 'buffer',
        throwHttpErrors: false,
    }),
    /** @type {PropMaker} */
    iter_url: null,
    iter_randip: new PropMaker('{}.{}.{}.{}', ['1-254', '1-254', '1-254', '1-254'])
}


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
        checkDelay: 5000,
    };

    constructor() {
        // 在这里初始化任务的基本信息
        super();
        let marks = ['', '', '']
        if (common.proxy) {
            marks[1] = 'P'
        }
        if (common.cookies) {
            marks[0] = 'C'
        }

        let _ = marks.join('')
        _ = _ && `[${_}]`
        this.title = `t${this.tid}  ${_}`;
    }

    async init() {
        // 在这里生成任务的需要的数据
        let url = new URL(common.iter_url.next())


        this.props = {
            url: url,
            headers: {
                ...common.headers,
                'user-agent': new UserAgent().toString()
            },
            code: -1,
            len: -1
        };

        //TODO: referer == root|same|none|<url>
        if (true) {
            this.props.headers['referer'] = new URL('/', url).toString()
        }

        // randomized X-Forwarded-For and X-Real-IP address
        if (true) {
            let x = common.iter_randip.next()
            this.props.headers['X-Forwarded-For'] = x
            this.props.headers['X-Real-IP'] = x
        }
    }

    async run() {
        /**@type {Response} */
        let res = await got(this.props.url, {
            headers: this.props.headers,
            // TODO: cookiejar: ...
        }, common.req_opts);


        this.updateUsedTime()
        this.emit('ok')

        this.props.code = res.statusCode
        this.props.len = res.body.length
        this.title = 't' + this.tid
            + ' => ' + this.props.code
            + ' ' + readableBytes(this.props.len)
            + ' ' + adaptiveToFixed(this.used_time / 1000) + 's'
    }

    /**
     * 
     * @param {string[]} args 
     * @param {object} flags 
     */
    static async parseArgs(args, flags) {
        [common.url = 'http://httpbin.org/delay/10', ...common.rules] = args;
        // TODO: 处理带分类前缀的规则组
        common.iter_url = new PropMaker(common.url, common.rules)
        common.headers = mixHeader(COMMON_HEADERS_RAW.split('\n'))
        // flags.proxy = 'http://localhost:8050';
        // flags.proxy = 'socks5://localhost:8050';

        common.req_opts.method = flags.method

        if (flags.proxy) {
            if (flags.proxy.startsWith('socks')) {
                param.proxy = new SocksProxyAgent(flags.proxy);
            } else if (flags.proxy.startsWith('http')) {
                param.proxy = new HttpProxyAgent(flags.proxy)
            }
            common.req_opts.agent = {
                http: param.proxy,
                https: param.proxy,
                http2: param.proxy,
            }
        }
    }
}
/**
 * 合并HTTP头部行与默认值
 * @param {string[]} raw_lines 原始头部行数组
 * @param {Object} defaults 默认头部对象
 * @returns {Object} 合并后的头部对象
 */
function mixHeader(raw_lines, defaults = {}) {
    let h = { ...defaults };
    for (const line of raw_lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue; // 忽略无效行
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        h[key] = value;
    }
    return h;
}
