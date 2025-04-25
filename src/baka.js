import EventEmitter from 'events';
import Denque from 'denque';
import BaseTask from './tasks/base.js';
import { performance } from 'perf_hooks';
import { perfStats } from './util.js'
import { adaptiveToFixed, readableBytes } from './util.js';

/**
 * @typedef {import('./tasks/base.js').TaskConfig} TaskConfig
 */

/**
 * @event ManagerModel#init
 * @description 当任务管理器初始化完成时触发
 */

/**
 * @event ManagerModel#pickup
 * @param {BaseTask} task - 被接取的任务实例
 * @description 当接取一个新任务时触发
 */

/**
 * @event ManagerModel#popup
 * @param {BaseTask} task - 结束的任务实例
 * @description 当任务完成并从存活列表中移除时触发
 */

/**
 * @event ManagerModel#check
 * @param {any} health - 健康检查的结果
 * @description 当执行健康检查时触发
 */

/**
 * 任务管理器模型类，负责管理任务的生命周期和状态
 * @extends EventEmitter
 */
export default class ManagerModel extends EventEmitter {

  /**
   * @param {typeof BaseTask} TaskFactoryClass - 任务工厂类，用于创建任务实例
   * @param {TaskConfig} [overConfig={}] - 任务配置覆盖对象
   */
  constructor(TaskFactoryClass, overConfig = {}) {
    super();

    /** @member {typeof BaseTask} TaskFactoryClass - 任务工厂类 */
    this.TaskFactoryClass = TaskFactoryClass;

    /** @member {TaskConfig} config - 合并后的任务配置 */
    this.config = { ...TaskFactoryClass?.config, ...overConfig };

    /** @member {boolean} running - 管理器运行状态 */
    this.running = false;

    /** @member {Object} sheet - 任务状态存储对象 */
    this.sheet = {
      /** @member {Set<BaseTask>} alives - 存活中的任务集合 */
      alives: new Set(),

      /** @member {Denque} results - 成功任务结果队列 */
      results: new Denque([], { capacity: this.config.maxResultCache }),

      /** @member {Denque} errors - 失败任务错误队列 */
      errors: new Denque([], { capacity: this.config.maxErrorCache }),
    };

    /** @member {Object} stats - 任务统计信息 */
    this.stats = {
      /** @member {number} total - 总任务数 */
      total: 0,

      /** @member {number} alive - 当前存活任务数 */
      alive: 0,

      /** @member {number} ok - 成功任务数 */
      ok: 0,

      /** @member {number} fail - 失败任务数 */
      fail: 0,

      /** @member {number} err - 错误任务数 */
      err: 0,
    };

    this.perf = {
      cpu: 0,
      mem: 0,
      net_rx: 0,
      net_tx: 0,
      net_sp: 0
    };

    this.clock_init = performance.now()
    this.clock_now = 0;
    this.clock_timer = null;


    /** @member {number|null} healthCheckTimer - 健康检查定时器ID */
    this.healthCheckTimer = null;

    /** @member {Denque} healthHistory - 健康检查历史记录 */
    this.healthHistory = new Denque({ capacity: 1024 });
  }

  /**
   * 初始化管理器
   * @async
   */
  async init() {

    this.emit('init');
  }

  /**
   * 任务执行方法，创建并启动任务实例
   * @async
   * @returns {Promise<BaseTask>} 返回创建的任务实例
   * @emits ManagerModel#pickup
   * @emits ManagerModel#popup
   */
  async pickup() {
    /** @type {BaseTask} */
    let task = new this.TaskFactoryClass();
    this.sheet.alives.add(task);
    this.stats.total++;
    this.stats.alive = this.sheet.alives.size;
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
      this.stats.alive = this.sheet.alives.size;
      this.emit('popup', task);
    });

    this.emit('pickup', task);
    return task;
  }

  /**
   * 启动任务管理器，开始周期性地接取和执行任务，并启动健康检查定时器
   * @async
   * @emits ManagerModel#check
   */
  async start() {
    if (this.running) return;
    this.running = true;

    this.clock_timer = setInterval(async () =>{
      this.tick();
    }, 1000);
    
    // 健康检查定时器
    this.healthCheckTimer = setInterval(async () => {
      // PERFORMANCE: 这里可以考虑不转换数据结构，直接传递引用
      const health = await this.TaskFactoryClass.check(
        [...this.sheet.alives],
        this.sheet.results.toArray(),
        this.sheet.errors.toArray(),
        this.healthHistory.toArray()
      );
      this.healthHistory.push(health);
      this.emit('check', health);
    }, this.config.check);

    this.emit('start');

    // 任务接取循环
    while (this.running) {
      let count = Math.floor(
        Math.random() * this.config.pickupCountPlus + this.config.pickupCount
      );
      for (let i = 0; i < count; i++) {
        if (this.sheet.alives.size < this.config.maxConcurrent) {
          let task = await this.pickup();

          (async () => {
            try {
              await task.wrapped_init();
              await task.wrapped_run();
            }
            catch (err) {
              task.emit('err', err);
              task.emit('end');
            }
          })()
        }
      }
      await this.TaskFactoryClass.delay();
    }
  }


  async tick() {
    try {
      // this.emit('echo', 'tick start');
      this.clock_now = performance.now() - this.clock_init;
      this.perf = await perfStats();
      this.emit('tick');
      // this.emit('echo', 'tick end');

    }
    catch (err) {
      this.emit('echo', err + '');
    }
  }

  /**
   * 暂停任务管理器，停止接取新任务并清除健康检查定时器
   */
  pause() {
    this.running = false;
    clearInterval(this.healthCheckTimer);
    clearInterval(this.clock_timer);
    this.emit('pause');
  }
}
