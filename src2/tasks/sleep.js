import BaseTask from './base.js';
/**
 * @typedef {import('./tasks/base.js').TaskConfig} TaskConfig
 */

/**
 * 休眠测试任务类，用于验证任务调度系统的并发处理能力
 * @extends BaseTask
 */
export default class SleepTask extends BaseTask {
  /**
   * 任务配置信息
   * @static
   * @type {TaskConfig}
   */
  static config = {
    ...super.config,
    name: 'sleep',
    description: '随机休眠测试任务',
    maxConcurrent: 12,      // 降低并发数方便观察效果
    delayPlus: 500,
    checkDelay: 5000        // 缩短健康检查间隔
  };

  /**
   * 初始化休眠任务
   * @async
   * @override
   */
  async init() {
    // 生成随机参数
    /** @member {number} duration - 实际休眠时长（毫秒） */
    this.duration = Math.floor(Math.random() * 15000 + 5000);
    /** @member {number} startTime - 精确执行开始时间戳 */
    this.startTime = performance.now();
  }

  /**
   * 执行随机休眠
   * @async
   * @override
   * @emits SleepTask#progress
   */
  async run() {
    
    // 分阶段休眠（每1秒触发进度事件）
    const steps = Math.floor(this.duration / 1000);
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, 1000));
      /**
       * @event SleepTask#progress
       * @type {object}
       * @property {number} current 当前进度(秒)
       * @property {number} total 总时长(秒)
       */
      this.emit('progress', { 
        current: i, 
        total: steps,
        elapsed: performance.now() - this.startTime
      });
    }

    // 处理剩余时间
    const remaining = this.duration % 1000;
    if (remaining > 0) {
      await new Promise(r => setTimeout(r, remaining));
    }
  }

  /**
   * 任务清理
   * @async
   * @override
   */
  async cleanup() {
    // 记录完整执行时长
    /** @member {number} preciseDuration - 精确执行时长 */
    this.preciseDuration = performance.now() - this.startTime;
  }
}
