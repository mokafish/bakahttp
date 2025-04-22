import { TaskBase } from './TaskBase.js';

export default class SleepTask extends TaskBase {
  static DEFAULT_CONFIG = {
    ...super.DEFAULT_CONFIG,
    name: 'sleep',
    description: 'Delayed execution task',
    maxConcurrent: 10,
    delayRange: [1000, 5000]
  };

  constructor(config) {
    super(config);
    this.counter = 0;
  }

  async execute() {
    const taskId = this._generateId();
    try {
      this.emit('taskStart', taskId);
      
      const delay = this._calculateDelay();
      await new Promise(resolve => 
        setTimeout(resolve, delay)
      );
      
      const result = this.formatResult({
        id: taskId,
        delay,
        status: 'success'
      });
      
      this.emit('taskSuccess', result);
      return result;
    } catch (error) {
      const errorResult = this.formatResult({
        id: taskId,
        error: error.message,
        status: 'failed'
      });
      
      this.emit('taskError', errorResult);
      throw error;
    } finally {
      this.emit('taskEnd', taskId);
    }
  }

  _generateId() {
    return `${this.config.name}-${++this.counter}`;
  }

  _calculateDelay() {
    const [min, max] = this.config.delayRange;
    return Math.floor(Math.random() * (max - min)) + min;
  }
}

// 工厂函数便于使用
export function createSleepTask(config) {
  return new SleepTask(config);
}