// core/models/TaskModel.js
export class TaskModel {
    constructor(taskInstance) {
      this.task = taskInstance;
      this.state = {
        running: new Set(),
        results: [],
        errors: [],
        metrics: {
          totalExecuted: 0,
          successRate: 1.0
        }
      };
      
      this._bindEvents();
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
  
    async start() {
      await this.task.initialize();
      this.scheduler = setInterval(async () => {
        if (this.state.running.size < this.task.config.maxConcurrent) {
          this.task.execute().catch(() => {});
        }
      }, await this.task.tick());
      
      this.healthChecker = setInterval(async () => {
        const report = await this.task.healthCheck();
        this.emit('healthCheck', report);
      }, this.task.config.checkInterval);
    }
  
    stop() {
      clearInterval(this.scheduler);
      clearInterval(this.healthChecker);
      this.task.terminate();
    }
  }