import { Context } from '../context';
import Preload from './preload';
import { readFileSync } from 'fs';
import '../types/window';
import { join } from 'path';
import { branch, commit } from '../../buildinfo.json';
import config from '../config';

export default class GamePreload extends Preload {
    context = Context.Game;

    onLoadStart() {
        window.OffCliV = true;
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