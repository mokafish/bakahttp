// core/tasks/TaskBase.js
import EventEmitter from 'events';

export class TaskBase extends EventEmitter {
  static DEFAULT_CONFIG = {
    name: 'unnamed_task',
    description: 'No description',
    maxConcurrent: 5,
    maxResultCache: 100,
    maxErrorCache: 50,
    checkInterval: 3000
  };

  constructor(config = {}) {
    super();
    this.config = { ...this.constructor.DEFAULT_CONFIG, ...config };
    this._validateConfig();
  }

  _validateConfig() {
    if (!this.config.name) {
      throw new Error('Task must have a name');
    }
  }

  async initialize() {
    // 可被子类覆盖的初始化方法
    this.emit('initialized', this.config);
  }

  async run() {
    // 抽象方法，必须由子类实现
    throw new Error('run() method must be implemented');
  }

  async tick() {
    // 默认的间隔控制逻辑
    return new Promise(resolve => 
      setTimeout(resolve, 1000 + Math.random() * 500)
    );
  }

  async healthCheck() {
    // 默认的健康检查实现
    return { healthy: true, timestamp: Date.now() };
  }

  formatResult(data) {
    // 结果格式化模板方法
    return {
      task: this.config.name,
      timestamp: Date.now(),
      ...data
    };
  }

  cleanup() {
    // 清理资源
    this.removeAllListeners();
  }
}