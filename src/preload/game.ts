import { Context } from '../context';
import Preload from './preload';
import { readFileSync } from 'fs';
import '../types/window';
import { join } from 'path';
import { branch, commit } from '../../buildinfo.json';
import { waitFor } from '../util';

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
        injectHSP();
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

async function injectHSP() {
    await waitFor(() => window.windows?.[4] && window.windows[4].gen);

    const ogen = window.windows[4].gen;
    window.windows[4].gen = function () {
        setTimeout(() => {
            let statHolder = document.getElementById('statHolder');
            if (!statHolder) return;

            let stats = statHolder.children[2].children;

            let hits = -1;
            let headshots = -1;
            let accuracyInd = -1;

            for (let i = 0; i < stats.length; i++) {
                let stat = stats[i];
                let statName = stat.childNodes[0].textContent;

                if (statName == 'Hits') {
                    hits = Number(stat.childNodes[1].textContent.replaceAll(',', ''));
                } else if (statName == 'Headshots') {
                    headshots = Number(stat.childNodes[1].textContent.replaceAll(',', ''));
                } else if (statName == 'Accuracy') {
                    accuracyInd = i;
                }
            }

            if (hits == -1 || headshots == -1 || accuracyInd == -1) return;

            let hsp = stats[0].cloneNode(true);
            hsp.childNodes[0].textContent = 'HS%';
            hsp.childNodes[1].textContent = (headshots / hits * 100).toFixed(2) + '%';

            statHolder.children[2].insertBefore(hsp, stats[accuracyInd + 1]);
        });
        return ogen.apply(this, arguments);
    };
}