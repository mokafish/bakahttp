import EventEmitter from 'events';



/**
 * @event BaseTask#initialized
 * @description 当任务初始化完成时触发
 */

/**
 * @event BaseTask#start
 * @description 当任务开始执行时触发
 */

/**
 * @event BaseTask#ok
 * @description 当任务成功完成时触发
 */

/**
 * @event BaseTask#fail
 * @description 当任务失败时触发
 */


/**
 * @event BaseTask#err
 * @param {Error} error - 发生的错误对象
 * @description 当任务执行过程中发生错误时触发
 */

/**
 * @event BaseTask#end
 * @description 当任务执行结束时触发
 */


/**
 * @typedef {Object} TaskConfig
 * @property {string} name - 任务类型名称
 * @property {string} description - 任务类型描述
 * @property {number} maxConcurrent - 最大并发任务数
 * @property {number} maxResultCache - 最大结果缓存数量
 * @property {number} maxErrorCache - 最大错误缓存数量
 * @property {number} checkDelay - 定期健康检查间隔（毫秒）
 * @property {number} delay - 基础间隔时间（毫秒）
 * @property {number} delayPlus - 最大随机间隔附加时间（毫秒）
 * @property {number} pickupCount - 单个接取周期内的任务提取数量
 * @property {number} pickupCountPlus - 单个接取周期内的任务提取数量附加值
 */

/**
 * 基础任务模型类，继承自EventEmitter，提供任务管理的基础结构和生命周期事件
 * @extends EventEmitter
 */
export default class BaseTask extends EventEmitter {
    /**
     * 任务配置信息
     * @type {TaskConfig}
     * @static
     */
    static config = {
        name: 'base',
        description: 'base task',
        maxConcurrent: 16,
        maxResultCache: 100,
        maxErrorCache: 200,
        checkDelay: 12000,
        delay: 1000,
        delayPlus: 4000,
        pickupCount: 1,
        pickupCountPlus: 0,
    };

    /**
     * 创建任务实例
     * @constructor
     */
    constructor() {
        super();
        /** @member {Object} props - 任务自定义属性存储对象 */
        this.props = {};
        /** @member {number} tid - 唯一任务ID */
        this.tid = BaseTask.nextID();
        /** @member {string} title - 任务标题 */
        this.title = `${this.constructor.config.name} ${this.tid}`;
        /** @member {string} note - 任务备注信息 */
        this.note = '-';
        /** @member {number} start_time - 任务开始时间戳（毫秒） */
        this.start_time = 0;
        /** @member {number} end_time - 任务结束时间戳（毫秒） */
        this.end_time = 0;
        /** @member {number} used_time - 任务已用时间（秒） */
        this.used_time = 0;
        /** 
         * @member {string} state - 任务的执行状态 
         * @type {'ready'|'running'|'end'}
         */
        this.state = 'ready';
    }

    /**
     * 初始化任务（需要子类实现）
     * @async
     * @abstract
     */
    async init() {
        // 初始化，通常用于提前准备数据，如参数生成
    }

    /**
     * 内部初始化方法（调用用户实现的initialize方法）
     * @async
     * @emits BaseTask#init
     */
    async wrapped_init() {
        await this.init();
        this.emit('init');
    }
    /**
     * 任务执行主方法（必须由子类实现）
     * @async
     * @abstract
     * @throws {Error} 必须实现该方法
     */
    async run() {
        throw new Error('run() method must be implemented');
    }

    /**
     * 内部执行流程控制
     * @async
     * @emits BaseTask#start
     * @emits BaseTask#ok
     * @emits BaseTask#err
     * @emits BaseTask#end
     */
    async wrapped_run() {
        this.start_time = Date.now();
        this.state = 'running';
        this.emit('start');
        try {
            await this.run();
            this.emit('ok');
        } catch (err) {
            this.emit('err', err);
        } finally {
            this.end_time = Date.now();
            this.state = 'end';
            this.updateUsedTime();
            await this.cleanup();
        }
        this.emit('end');
    }

    /**
     * 任务清理方法（可选实现）
     * @async
     */
    async cleanup() { }

    /**
     * 更新时间统计信息
     */
    updateUsedTime() {
        if (this.state === 'running') {
            this.used_time = (Date.now() - this.start_time) / 1000;
        } else if (this.state === 'end') {
            this.used_time = (this.end_time - this.start_time) / 1000;
        }
    }

    /**
     * 创建自增计数器
     * @static
     * @returns {function(any=):number} 返回一个可以按分类生成自增ID的函数
     * @example
     * const next = autoincrement();
     * next('A'); // 1
     * next('A'); // 2
     * next('B'); // 1
     */
    static autoincrement() {
        let m = new Map();
        return (x = null) => {
            if (m.has(x)) {
                m.set(x, m.get(x) + 1);
            } else {
                m.set(x, 1);
            }
            return m.get(x);
        }
    }

    /** @static @type {function(any=):number} 顺序id生成器 */
    static nextID = BaseTask.autoincrement();

    /**
     * 定期健康检查方法（可选实现）
     * 返回0~1之间的数字，0表示不健康，1表示健康
     * 负数表示严重异常，会自动暂停接取新任务，sleep(abs(n))后恢复
     * @static
     * @optional
     * @param {Array} alive_tasks - 存活中的任务列表
     * @param {Array} success_tasks - 成功任务列表
     * @param {Array} error_tasks - 失败任务列表
     * @returns {number} 返回健康检查结果
     */
    static check(alive_tasks = [], success_tasks = [], error_tasks = [], history = []) {
        // health check
        return 1
    }

    /**
     * 间隔时间 config.delay+(0~config.delayPlus) 毫秒
     * @static
     * @async
     * @returns {Promise<void>} 在随机时间后resolve的Promise
     */
    static async delay() {
        let n = this.config.delayPlus == 0
            ? this.config.delay
            : Math.random() * this.config.delayPlus + this.config.delay;
        return await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, n);
        });
    }
}
