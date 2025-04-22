import EventEmitter from 'events';

// 程序钩子
export const t = new EventEmitter(); 
export async function init() {
    t.name = 'sleep';
    t.info = 'sleep task for test';
    t.max_concurrent = 10;
    t.max_cache_results = 100;
    t.max_cache_errors = 100;
    t.check_interval = 1000; 

    t.emit('init.end', t);
}


export async function run() {
    const id = mkid();
    const data = {
        title: `${t.name} ${id}`,
    };

    t.emit('run', data);
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        t.emit('run.ok', data);
    }
    catch (err) {
        t.emit('run.err', data, err);
    }
    finally {
        t.emit('run.end', data);
    }
}

export async function tick() {
    let n = Math.random() * 1000 + 1000;
    await new Promise(resolve => setTimeout(resolve, n));
}

export async function check(running_datas, history_results, history_errors) {
    t.emit('echo', 'check');
    return 0
}

/******* 用户辅助函数 *******/ 
function Counter() {
    let count = 0;
    return  () => count++;
}

const mkid = Counter();

