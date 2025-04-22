// core/services/TaskLoader.js
export class TaskLoader {
    static async load(name) {
      const modulePaths = [
        `./tasks/${name}.task.js`,
        `../node_modules/task-${name}/index.js`,
        import.meta.resolve(`task-${name}`)
      ];
  
      for (const path of modulePaths) {
        try {
          const module = await import(path);
          return module.createTask || module.default?.createTask;
        } catch (error) {
          if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
        }
      }
      throw new Error(`Task ${name} not found`);
    }
  
    static async createTask(name, config) {
      const factory = await this.load(name);
      return factory(config);
    }
  }