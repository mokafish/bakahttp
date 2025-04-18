export async function load(name = 'sleep') {
  const attempts = [() => import(`./${name}.js`), () => import(`./tasks/${name}.js`), () => import(import.meta.resolve(`../tasks/${name}.js`))];
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      if ('ERR_MODULE_NOT_FOUND' != err.code) {
        throw err;
      }
    }
  }
  throw new Error(`Task ${name} not found`);
}
export async function start(name = 'sleep') {
  const task = await load(name);
  if (task.init) {
    await task.init();
  }
  if (task.run) {
    task.run();
  }
  if (task.delay) {
    task.delay();
  }
  return task.eventEmitter;
}