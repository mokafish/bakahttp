import EventEmitter from 'events';
/**
 * 基础任务模型类，继承自EventEmitter，提供任务管理的基础结构和生命周期事件
 * @extends EventEmitter
 */
export class BaseTaskModel extends EventEmitter {
  /**
   * 任务配置信息
   * @static
   * @type {Object}
   * @property {string} name - 任务类型名称
   * @property {string} description - 任务类型描述
   * @property {number} maxConcurrent - 最大并发任务数
   * @property {number} maxResultCache - 最大结果缓存数量
   * @property {number} maxErrorCache - 最大错误缓存数量
   * @property {number} checkInterval - 健康检查间隔（毫秒）
   * @property {number} breakTimeBase - 基础间隔时间（毫秒）
   * @property {number} breakTimeMaxAddendum - 最大随机间隔附加时间（毫秒）
   */
  static config = {
    name: 'base_task',
    description: 'base task model',
    maxConcurrent: 16,
    maxResultCache: 100,
    maxErrorCache: 50,
    checkInterval: 3000,
    breakTimeBase: 1000,
    breakTimeMaxAddendum: 4000,
  };

  /**
   * 创建基础任务实例
   * @constructor
   */
  constructor() {
    super();
    /** @member {Object} props - 任务自定义属性存储对象 */
    this.props = {};
    /** @member {number} tid - 唯一任务ID */
    this.tid = BaseTaskModel.nextId();
    /** @member {string} title - 任务标题，格式：'base task {tid}' */
    this.title = `base task ${this.tid}`;
    /** @member {string} note - 任务备注信息 */
    this.note = '-';
    /** @member {?number} start_time - 任务开始时间戳（毫秒） */
    this.start_time = null;
    /** @member {?number} end_time - 任务结束时间戳（毫秒） */
    this.end_time = null;
    /** @member {number} used_time - 任务已用时间（秒） */
    this.used_time = 0;
    /** 
     * @member {string} state - 任务状态 
     * @type {'ready'|'running'|'end'}
     */
    this.state = 'ready';
  }

  /**
   * 初始化任务（需要子类实现）
   * @async
   * @abstract
   * @emits BaseTaskModel#initialized
   */
  async initialize() { }

  /**
   * 内部初始化方法（调用用户实现的initialize方法）
   * @async
   * @private
   * @emits BaseTaskModel#initialized
   */
  async _initialize() {
    await this.initialize();
    this.emit('initialized');
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
   * @private
   * @emits BaseTaskModel#start
   * @emits BaseTaskModel#ok
   * @emits BaseTaskModel#err
   * @emits BaseTaskModel#end
   */
  async _run() {
    this.start_time = Date.now();
    this.state = 'running';
    this.emit('start', this.tid);
    try {
      await this.run();
      this.emit('ok');
    } catch (err) {
      this.emit('err', err);
    } finally {
      this.end_time = Date.now();
      this.state = 'end';
      this._updateUsedTime();
      await this.cleanup();
    }
    this.emit('end');
  }

  /**
   * 任务清理方法（可选实现）
   * @async
   * @optional
   */
  async cleanup() { }

  /**
   * 更新时间统计信息
   * @private
   */
  async _updateUsedTime() {
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
    let table = new Map();
    return (x = null) => {
      if (table.has(x)) {
        table.set(x, table.get(x) + 1);
      } else {
        table.set(x, 1);
      }
      return table.get(x);
    }
  }

  /** @static @type {function(any=):number} 任务ID生成器 */
  static nextId = BaseTaskModel.autoincrement();

  /**
   * 健康检查方法（可选实现）
   * @static
   * @optional
   * @param {Array} alive_tasks - 存活中的任务列表
   * @param {Array} success_tasks - 成功任务列表
   * @param {Array} error_tasks - 失败任务列表
   */
  static healthCheck(alive_tasks = [], success_tasks = [], error_tasks = []) { }

  /**
   * 生成随机间隔时间（1000-3000毫秒）
   * @static
   * @async
   * @returns {Promise<void>} 在随机时间后resolve的Promise
   */
  static async breakTime() {
    let n = Math.random() * 2000 + 1000;
    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, n);
    });
  }
}

/**
 * 初始化完成事件
 * @event BaseTaskModel#initialized
 */

/**
 * 任务开始事件
 * @event BaseTaskModel#start
 * @type {number} 任务ID
 */

/**
 * 任务成功完成事件
 * @event BaseTaskModel#ok
 */

/**
 * 任务失败事件
 * @event BaseTaskModel#err
 * @type {Error} 错误对象
 */

/**
 * 任务结束事件（无论成功失败）
 * @event BaseTaskModel#end
 */

export class ManagerModel {

  constructor(TaskFactoryClass, overConfig = {}) {

    this.config = { ...TaskFactoryClass?.config, ...overConfig };

    this.state = {
      running: false,
      alives: new Set(),
      results: [],
      errors: [],
      metrics: {
        totalExecuted: 0,
        successRate: 1.0
      }
    };

    this.TaskFactoryClass = TaskFactoryClass;
  }



  _bindEvents() {
    this.task
      .on('taskStart', id => {
        this.state.running.add(id);
        this._updateMetrics();
      })
      .on('taskSuccess', result => {
        this.state.results.push(result);
        if (this.state.results.length > this.task.config.maxResultCache) {
          this.state.results.shift();
        }
      })
      .on('taskError', error => {
        this.state.errors.push(error);
        if (this.state.errors.length > this.task.config.maxErrorCache) {
          this.state.errors.shift();
        }
      })
      .on('taskEnd', id => {
        this.state.running.delete(id);
        this._updateMetrics();
      });
  }

  _updateMetrics() {
    this.state.metrics.totalExecuted =
      this.state.results.length + this.state.errors.length;

    const successCount = this.state.results.length;
    this.state.metrics.successRate =
      this.state.metrics.totalExecuted > 0
        ? successCount / this.state.metrics.totalExecuted
        : 1.0;
  }

  async _start() {
    await this.task.initialize();
    this.scheduler = setInterval(async () => {
      if (this.state.running.size < this.task.config.maxConcurrent) {
        this.task.execute().catch(() => { });
      }
    }, await this.task.tick());

    this.healthChecker = setInterval(async () => {
      const report = await this.task.healthCheck();
      this.emit('healthCheck', report);
    }, this.task.config.checkInterval);
  }

  _stop() {
    clearInterval(this.scheduler);
    clearInterval(this.healthChecker);
    this.task.terminate();
  }
}