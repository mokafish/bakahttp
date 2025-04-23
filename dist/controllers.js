// core/controllers/TaskController.js
import { TaskLoader } from '../services/TaskLoader.js';
export class TaskController {
  constructor() {
    this.tasks = new Map();
  }
  async startTask(name) {
    const taskModule = await TaskLoader.load(name);
    const taskModel = new TaskModel(taskModule);
    await taskModel.initialize();
    taskModel.startProcessing();
    taskModel.startHealthCheck();
    this.tasks.set(name, taskModel);
    return taskModel;
  }
  getTask(name) {
    return this.tasks.get(name);
  }
  stopTask(name) {
    const task = this.tasks.get(name);
    if (task) {
      task.cleanup();
      this.tasks.delete(name);
    }
  }
}