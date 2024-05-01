import { Context } from '../context';
import Preload from './preload';
import { readFileSync } from 'fs';
import '../types/window';
import { join } from 'path';
import { branch, commit } from '../../buildinfo.json';

export default class GamePreload extends Preload {
    context = Context.Game;

    onLoadStart() {
        window.OffCliV = true;

        if (process.platform == 'win32') loadMouseDriver();
    }

    onLoadEnd() {
        window.clientExit.style.display = 'flex';
        window.closeClient = () => window.close();

        let style = document.createElement('style');
        style.textContent = readFileSync(
            join(__dirname, '../../assets/style/game.css'),
            'utf8'
        );
        document.head.append(style);

        injectWatermark();
    }
}

function injectWatermark() {
    let watermark = document.createElement('div');
    watermark.dataset.text = '[Rays] Nova';
    watermark.dataset.version = `${branch}/${commit}`;
    watermark.id = 'clientWatermark';

    document
        .getElementById('matchInfo')
        .insertAdjacentElement('beforebegin', watermark);

    document.getElementById('timerHolder').style.cssText +=
        ';width:fit-content!important';
}

function loadMouseDriver() {
    try {
        const driver = require(join(
            __dirname,
            '../../mouseDriver/build/Release/addon.node'
        ));

        console.log(
            'Mouse driver loaded.',
            (window as any).getEventListeners(document.documentElement)
        );

        setInterval(() => {
            let data = driver.poll();

            if (document.pointerLockElement) {
            }
        }, 1000 / 360); // 360Hz
    } catch (err) {
        console.error('Failed to load mouse driver!');
        console.error(err);
    }
}
