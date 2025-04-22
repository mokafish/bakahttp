import Denque from "denque";

export async function load(name = 'sleep') {
    const attempts = [
        () => import(`./${name}.js`),
        () => import(`./tasks/${name}.js`),
        () => import(import.meta.resolve(`../tasks/${name}.js`)),
    ];

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


    let o = { task };
    o.max_concurrent = t.max_concurrent || 16;
    o.history_results = new Denque({ capacity: t.max_cache_results });
    o.history_errors = new Denque({ capacity: t.max_cache_errors });
    o.alive_datas = new Denque({ capacity: o.max_concurrent });


    o.alives = 0;
    o.total_results = 0;
    o.total_errors = 0;
    o.pickup = async () => {
        while (true) {
            if (o.alives >= o.max_concurrent) {
                return;
            }

            o.alives++;
            o.task.run().then(() => {
                o.total_results++;
            }).catch((err) => {
                o.total_errors++;
            }).finally(() => {
                o.alives--;
            });
        }
    }

    o.pickup();


    if (task.check) {
        o.check_timer = setInterval(async () => {
            await task.check();
        }, task.check_interval || 1000);
    }

    return o;
}