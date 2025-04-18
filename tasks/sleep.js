import EventEmitter from 'events';

export const eventEmitter = new EventEmitter();
export const emit = eventEmitter.emit.bind(eventEmitter);
export const on = eventEmitter.on.bind(eventEmitter);

export const options = {
    title: 'sleep',
    desc: 'Sleep for a while',
    max: 10,
    
};


export async function init() {
    emit('init.end', options);
}

export async function run() {
    emit('run.main', options);
    await new Promise(resolve => setTimeout(resolve, 1000));
}

export async function delay() {
    await new Promise(resolve => setTimeout(resolve, 1000));
}
