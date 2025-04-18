
export const options = {
    title: 'sleep',
    desc: 'Sleep for a while',
    max: 10,
    
};


export async function init() {
    console.log('init task');
}

export async function run() {
    console.log('task main');
    await new Promise(resolve => setTimeout(resolve, 1000));
}

export async function delay() {
    await new Promise(resolve => setTimeout(resolve, 1000));
}
