import EventEmitter from 'events';
import Denque from 'denque';
/**
 * @typedef {Object} TaskConfig
  * @property {string} name - 任务类型名称
  * @property {string} description - 任务类型描述
  * @property {number} maxConcurrent - 最大并发任务数
  * @property {number} maxResultCache - 最大结果缓存数量
  * @property {number} maxErrorCache - 最大错误缓存数量
  * @property {number} checkTime - 健康检查间隔（毫秒）
  * @property {number} breakTimeBase - 基础间隔时间（毫秒）
  * @property {number} breakTimeMaxAddendum - 最大随机间隔附加时间（毫秒）
  * @property {number} pickupCount - 单个接取周期内的任务提取数量
  * @property {number} pickupCountMaxAddendum - 单个接取周期内的任务提取数量附加值
 */

/**
 * 基础任务模型类，继承自EventEmitter，提供任务管理的基础结构和生命周期事件
 * @extends EventEmitter
 */
export class BaseTaskModel extends EventEmitter {
  /**
   * 任务配置信息
   * @static
   * @type {TaskConfig}
  */
  static config = {
    name: 'base',
    description: 'base task',
    maxConcurrent: 16,
    maxResultCache: 100,
    maxErrorCache: 50,
    checkTime: 3000,
    breakTimeBase: 1000,
    breakTimeMaxAddendum: 4000,
    pickupCount: 1,
    pickupCountMaxAddendum: 0,
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
    this.tid = BaseTaskModel.seqNext();
    /** @member {string} title - 任务标题，格式：'base task {tid}' */
    this.title = `base task ${this.tid}`;
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
   * @emits BaseTaskModel#initialized
   */
  async initialize() {
    // 初始化，通常用于提前准备数据，如参数生成
  }

  /**
   * 内部初始化方法（调用用户实现的initialize方法）
   * @async
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
   */
  async cleanup() { }

  /**
   * 更新时间统计信息
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

  /** @static @type {function(any=):number} 任务ID生成器 */
  static seqNext = BaseTaskModel.autoincrement();

  /**
   * 健康检查方法（可选实现）
   * @static
   * @optional
   * @param {Array} alive_tasks - 存活中的任务列表
   * @param {Array} success_tasks - 成功任务列表
   * @param {Array} error_tasks - 失败任务列表
   */
  static check(alive_tasks = [], success_tasks = [], error_tasks = []) {
    // health check
  }

  /**
   * 生成随机间隔时间（1000-5000毫秒）
   * @static
   * @async
   * @returns {Promise<void>} 在随机时间后resolve的Promise
   */
  static async breakTime() {
    let n = Math.random() * this.config.breakTimeMaxAddendum + this.config.breakTimeBase;
    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, n);
    });
  }
}


/**
 * 任务管理器模型类，负责管理任务的生命周期和状态
 * @extends EventEmitter
 */
export class ManagerModel extends EventEmitter {

  /**
   *  
   * @param {Class} TaskFactoryClass - 任务工厂类，用于创建任务实例
   * @param {TaskConfig} [overConfig={}] - 任务配置覆盖对象
   */
  constructor(TaskFactoryClass, overConfig = {}) {
    super();
    /** @member {Class} TaskFactoryClass - 任务工厂类 */
    this.TaskFactoryClass = TaskFactoryClass;
    this.config = { ...TaskFactoryClass?.config, ...overConfig };
    this.running = false;
    this.sheet = {
      alives: new Set(),
      results: new Denque({ capacity: this.config.maxResultCache }),
      errors: new Denque({ capacity: this.config.maxErrorCache }),

    };
    this.stats = {
      total: 0,
      ok: 0,
      fail: 0,
      err: 0,
    }
  }

  async initialize() { }

  /**
   * 任务执行方法，创建并启动任务实例
   * @async
   * @returns {Promise<BaseTaskModel>} 返回创建的任务实例
   * @emits BaseTaskModel#ok
   * @emits BaseTaskModel#fail
   * @emits BaseTaskModel#err
   * @emits BaseTaskModel#end
   */
  async pickup() {
    /** @type {BaseTaskModel} */
    let task = new this.TaskFactoryClass();
    this.sheet.alives.add(task);
    task.on('ok', () => {
      this.stats.ok++;
      this.sheet.results.push(task);
    });
    task.on('fail', (err) => {
      this.stats.fail++;
      this.sheet.results.push(err);
    });
    task.on('err', (err) => {
      this.stats.err++;
      this.sheet.errors.push(err);
    });
    task.on('end', () => {
      this.sheet.alives.delete(task);
      this.stats.total++;
      this.emit('popup', task);
    });

    await task._initialize();
    this.emit('pickup', task);

    return task;
  }

  async start() {
    if (this.running) return
    this.running = true;

    while (this.running) {
      let count = Math.floor(Math.random() * this.config.pickupCountMaxAddendum + this.config.pickupCount);
      for (let i = 0; i < count; i++) {
        if (this.sheet.alives.size < this.config.maxConcurrent) {
          let task = await this.pickup(); // initialized
          // 执行任务只处理未捕获的异常
          task._run().catch((err) => {
            task.emit('err', err);
            task.emit('end');
          });
        }
      }
      await this.TaskFactoryClass.breakTime(); // 等待随机时间
    }


    this.healthCheckTimer = setInterval(async () => {
      const health = await this.TaskFactoryClass.check(
        Array.from(this.sheet.alives.values()),
        this.sheet.results.toArray(),
        this.sheet.errors.toArray()
      );
      this.emit('check', health);
    }, this.task.config.checkTime);
  }

  pause() {
    this.running = false;
    clearInterval(this.healthCheckTimer);
  }
}