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
        hookChat();
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

function injectCategories(insertBefore: HTMLElement) {
    const categories = [
        {
            key: 'msg--player',
            name: 'Players',
            col: '#00ff00',
        },
        {
            key: 'msg--killfeed',
            name: 'Killfeed',
            col: '#ff0000',
        },
        {
            key: 'msg--unbox',
            name: 'Unboxings',
            col: '#0000ff',
        },
        {
            key: 'msg--server',
            name: 'Server',
            col: '#aa00ff',
        },
    ];

    const opacity = 0.1;

    const elem = document.createElement('div');
    const cssEl = document.createElement('style');
    elem.id = 'chatCategories'; // For 3rd party css makers

    for (let i = 0; i < categories.length; i++) {
        let category = categories[i];
        let enabled = config.get('chat.' + category.key, true);

        let btn = document.createElement('button');
        btn.className = 'cat' + (enabled ? '' : ' off');
        btn.textContent = category.name;
        btn.style.backgroundColor =
            category.col + (~~(opacity * 255)).toString(16).padStart(2, '0');

        btn.onclick = () => toggleCategory(cssEl, category.key, btn);
        elem.appendChild(btn);

        if (!config.get('chat.' + category.key, true))
            cssEl.textContent += `#chatList > div.${category.key} { display: none; }\n`;
    }

    insertBefore.insertAdjacentElement('beforebegin', elem);
    document.head.appendChild(cssEl);
}

function toggleCategory(
    stylesheet: HTMLStyleElement,
    category: string,
    button: HTMLButtonElement
) {
    let newValue = !config.get('chat.' + category, true);
    config.set('chat.' + category, newValue);

    if (newValue) {
        stylesheet.textContent = stylesheet.textContent.replace(
            `#chatList > div.${category} { display: none; }\n`,
            ''
        );

        button.classList.remove('off');
    } else {
        stylesheet.textContent += `#chatList > div.${category} { display: none; }\n`;
        button.classList.add('off');
    }
}

function hookChat() {
    const elem = document.getElementById('chatList');
    const mock = document.createElement('div');

    window.chatList = Object.defineProperties(
        {},
        {
            childNodes: {
                get: () =>
                    [...elem.childNodes].filter((e) =>
                        (e as HTMLElement).classList?.contains('vanillaChatMsg')
                    ),
            },
            insertAdjacentElement: {
                value: (position: InsertPosition, element: HTMLElement) => {
                    element.classList.add('vanillaChatMsg');
                    categorizeMessage(element);

                    mock.insertAdjacentElement(
                        position,
                        document.createElement('div')
                    );
                    elem.insertAdjacentElement(position, element);
                },
            },
            scrollHeight: {
                get: () => mock.scrollHeight,
            },
            clientHeight: {
                get: () => mock.clientHeight,
            },
            style: {
                get: () =>
                    new Proxy(mock.style, {
                        set: (target, prop, value) => {
                            elem.style[prop as any] = value;
                            return Reflect.set(target, prop, value);
                        },
                    }),
            },
        }
    ) as any;

    injectCategories(elem);
}

function categorizeMessage(elem: HTMLElement) {
    let msgNode = elem.firstChild;

    if (msgNode.childNodes.length > 1) elem.classList.add('msg--player');
    else {
        if (msgNode.firstChild.childNodes.length > 1) {
            if (
                (msgNode.firstChild as HTMLElement).children.length > 1 &&
                ![...msgNode.firstChild.childNodes].some(
                    (e) => e.nodeName === 'IMG'
                )
            )
                elem.classList.add('msg--unbox');
            else elem.classList.add('msg--killfeed');
        } else elem.classList.add('msg--server');
    }
}
