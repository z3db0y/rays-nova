export function waitFor(func: Function) {
    return new Promise(resolve => {
        let interval = setInterval(() => {
            let r = func();
            if(r) {
                clearInterval(interval);
                resolve(r);
            }
        });
    });
}