
export async function loadTask(name = 'sleep') {
  const attempts = [
      () => import(`./${name}.js`),
      () => import(`./tasks/${name}.js`),
      () => import(import.meta.resolve(`../tasks/${name}.js`)),
  ];

  for (const attempt of attempts) {
      try {
          return await attempt();
      } catch (err) {
        console.log(err);
        
          if ('ERR_MODULE_NOT_FOUND' != err.code) {
              throw err;
          }
      }
  }

  throw new Error(`Task ${name} not found`);
}