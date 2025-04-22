import Denque from "denque";
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
  const t = task.t || task.default.t;
  if (task.init) {
    await task.init();
  }
  let o = {
    task
  };
  o.max_concurrent = t.max_concurrent || 16;
  o.history_results = new Denque({
    capacity: t.max_cache_results
  });
  o.history_errors = new Denque({
    capacity: t.max_cache_errors
  });
  o.running_set = new Set();
  o.total_results = 0;
  o.total_errors = 0;
  t.on('run', data => {
    o.running_set.add(data);
    t.emit('submit', data);
  });
  t.on('run.ok', data => {
    o.total_results++;
    o.history_results.push(data);
    t.emit('cache.ok', data);
  });
  t.on('run.err', (data, err) => {
    o.total_errors++;
    o.history_errors.push(err);
    t.emit('cache.err', data);
  });
  t.on('run.end', data => {
    o.running_set.delete(data);
  });
  o.pickup = async () => {
    while (true) {
      if (o.running_set.size >= o.max_concurrent) {
        continue;
      }
      o.task.run().catch(err => {
        o.total_errors++;
        o.history_errors.push(err);
      });

      // .then(() => {
      //     o.total_results++;
      // }).catch((err) => {
      //     o.total_errors++;
      // }).finally(() => {
      //     o.alive_set.delete(id);
      // });

      await task.tick();
    }
  };
  o.pickup();
  if (task.check) {
    o.check_timer = setInterval(async () => {
      await task.check();
    }, t.check_interval || 1000);
  }
  return o;
}