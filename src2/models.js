import EventEmitter from 'events';

export class BaseTaskModel extends EventEmitter {
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


  constructor() {
    super();
    this.props = {};
    this.tid = BaseTaskModel.nextId();
    this.title = `base task ${this.tid}`;
    this.note = '-';
    this.start_time = null;
    this.end_time = null;
    this.used_time = 0;
    this.state = 'ready'; // ready, running, end

  }

  async initialize() {
  }

  async _initialize() {
    this.initialize();
    this.emit('initialized');
  }

  async run() {
    throw new Error('run() method must be implemented');
  }

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
      this.cleanup();
    }
    this.emit('end');
  }



  async cleanup() {
    //NOTE: method optional implemented
  }

  async _updateUsedTime() {
    if (this.state === 'running') {
      this.used_time = (Date.now() - this.start_time) / 1000;
    } else if (this.state === 'end') {
      this.used_time = (this.end_time - this.start_time) / 1000;
    }
  }

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

  static nextId = BaseTaskModel.autoincrement();

  static healthCheck(alive_tasks = [], success_tasks = [], error_tasks = []) {
    //NOTE: method optional implemented
  }

  static async breakTime() {
    let n = Math.random() * 2000 + 1000;
    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, n);
    });
  }
}

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