import { Context } from '../context';
import Preload from './preload';
import { readFileSync } from 'fs';
import '../types/window';
import { join } from 'path';
import { branch, commit } from '../../buildinfo.json';
import { ipcRenderer } from 'electron/renderer';

export default class GamePreload extends Preload {
    context = Context.Game;

    onLoadStart() {
        window.OffCliV = true;
    }

    onLoadEnd() {
        loadMouseDriver();

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
        if (!(window as any).getEventListeners) throw new Error('getEventListeners not found');
        console.log('Mouse handler loaded.');

        let lastData: any;

        let move: any;
        let down: any;
        let up: any;

        ipcRenderer.on('mouse-data', (_, mouseData) => {
            if (document.pointerLockElement && document.pointerLockElement.nodeName === 'CANVAS') {
                if (!move) {
                    let listeners = (window as any).getEventListeners(document.pointerLockElement);
                        
                    if (listeners.pointerrawupdate && listeners.pointerrawupdate.length) {
                        move = listeners.pointerrawupdate[0].listener;
                        document.pointerLockElement.removeEventListener('pointerrawupdate', move);
                    } else if (listeners.mousemove && listeners.mousemove.length) {
                        move = listeners.mousemove[0].listener;
                        document.pointerLockElement.removeEventListener('mousemove', move);
                    }

                    if (listeners.mousedown && listeners.mousedown.length) {
                        down = listeners.mousedown[0].listener;
                        document.pointerLockElement.removeEventListener('mousedown', down);
                    }

                    if (listeners.mouseup && listeners.mouseup.length) {
                        up = listeners.mouseup[0].listener;
                        document.pointerLockElement.removeEventListener('mouseup', up);
                    }

                    document.pointerLockElement.addEventListener('click', (event) => (event.target as HTMLElement).requestPointerLock());
                } else {
                    processMouseData(mouseData, lastData, {
                        move,
                        down,
                        up,
                    });
                }
            }

            lastData = mouseData;
        });
    } catch (err) {
        console.error('Failed to load mouse handler! (you can ignore this error if you are not on Windows)');
        console.error(err);
    }
}

function processMouseData(data: any, last: any, handles: { move: any, down: any, up: any }) {
    if (!last) return;

    let cx = data.wx + data.ww / 2;
    let cy = data.wy + data.wh / 2;

    let mx = Math.abs(data.x - cx) < 5 ? 0 : data.x - last.x;
    let my = Math.abs(data.y - cy) < 5 ? 0 : data.y - last.y;

    handles.move({
        isTrusted: true,
        movementX: mx,
        movementY: my,
        getCoalescedEvents: () => ([{
            isTrusted: true,
            movementX: mx,
            movementY: my,
        }])
    });
}