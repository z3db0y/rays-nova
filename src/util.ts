export function waitFor(func: Function, maxTime?: number) {
    return new Promise(resolve => {
        let start = Date.now();

        let interval = setInterval(() => {
            let r = func();
            if(r || (maxTime && Date.now() - start > maxTime)) {
                clearInterval(interval);
                resolve(r);
            }
        });
    });
}