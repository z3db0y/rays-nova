import { Context, fromURL } from '../context';
import Preload from './preload';
import GamePreload from './game';
import CommonPreload from './common';
import EditorPreload from './editor';

let url = new URL(window.location.href);
let context = fromURL(url);
let preload: Preload;
let commonPreload = new CommonPreload(context);

commonPreload.onLoadStart?.();
switch (context) {
    case Context.Game:
        preload = new GamePreload();
        preload.onLoadStart?.();
        break;
    case Context.Editor:
        preload = new EditorPreload();
        preload.onLoadStart?.();
        break;
}

document.addEventListener('DOMContentLoaded', () => {
    commonPreload?.onLoadEnd?.();
    preload?.onLoadEnd?.();
});
