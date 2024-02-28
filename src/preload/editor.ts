import { Context } from '../context';
import {
    GM_getValue,
    GM_setValue,
    parseHeader,
} from './GM_loader';
import Preload from './preload';

export default class EditorPreload extends Preload {
    context = Context.Editor;

    onLoadStart() {
        let editorPlus = new XMLHttpRequest();
        editorPlus.open(
            'GET',
            'https://cdn.jsdelivr.net/gh/j4k0xb/Krunker-Editor-Plus/userscript.user.js',
            false
        );
        editorPlus.send();

        if (editorPlus.status === 200) {
            let content = editorPlus.responseText;
            let info = parseHeader(content);

            let toGrant = {
                unsafeWindow: window,
                GM_getValue,
                GM_setValue,
            };

            try {
                new Function('window', ...Object.keys(toGrant), content)(
                    window,
                    ...Object.values(toGrant)
                );
            } catch (e) {
                console.error(e);
            }
        }
    }
}
