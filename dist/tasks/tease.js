import BaseTask from '../../dist/tasks/base.js';
/**
 * @typedef {import('./tasks/base.js').TaskConfig} TaskConfig
 */

const params = {
  min: 5000,
  max: 20000
};

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
  async init() {
    this.title = `tease_${this.tid}`;
  }
  async run() {
    this.title = `tease_${this.tid} ok`;
    this.emit('ok');
  }
}