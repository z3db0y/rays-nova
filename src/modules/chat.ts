import { Context, RunAt } from '../context';
import Module from '../module';
import Checkbox from '../options/checkbox';

export default class Chat extends Module {
    name = 'Chat Categories';
    id = 'chat';
    options = [];

    stylesheet = document.createElement('style');
    readonly categories = [
        {
            key: 'msg--player',
            name: 'Players',
            settName: 'player',
            col: '#00ff00',
        },
        {
            key: 'msg--killfeed',
            name: 'Killfeed',
            settName: 'kill feed',
            col: '#ff0000',
        },
        {
            key: 'msg--unbox',
            name: 'Unboxings',
            settName: 'unboxing',
            col: '#0000ff',
        },
        {
            key: 'msg--server',
            name: 'Server',
            settName: 'server',
            col: '#aa00ff',
        },
    ];

    contexts = [
        {
            context: Context.Game,
            runAt: RunAt.LoadEnd,
        },
    ];

    injectCategories(insertBefore: HTMLElement) {
        const opacity = 0.1;

        const elem = document.createElement('div');
        this.stylesheet = document.createElement('style');
        elem.id = 'chatCategories'; // For 3rd party css makers

        for (let i = 0; i < this.categories.length; i++) {
            let category = this.categories[i];
            let enabled = this.config.get('chat.' + category.key, true);

            let btn = document.createElement('button');
            btn.id = category.key;
            btn.className = 'cat' + (enabled ? '' : ' off');
            btn.textContent = category.name;
            btn.style.backgroundColor =
                category.col +
                (~~(opacity * 255)).toString(16).padStart(2, '0');

            btn.onclick = () => this.toggleCategory(category.key, btn);
            elem.appendChild(btn);

            if (!this.config.get(category.key, true))
                this.stylesheet.textContent += `#chatList > div.${category.key} { display: none; }\n`;
        }

        insertBefore.insertAdjacentElement('beforebegin', elem);
        document.head.appendChild(this.stylesheet);
    }

    toggleCategory(
        category: string,
        button: HTMLButtonElement,
        noUpdate?: boolean
    ) {
        let newValue = !this.config.get(category, true);

        if (!noUpdate) this.config.set(category, newValue);
        else newValue = !newValue;

        if (newValue) {
            this.stylesheet.textContent = this.stylesheet.textContent.replace(
                `#chatList > div.${category} { display: none; }\n`,
                ''
            );

            button.classList.remove('off');
        } else {
            this.stylesheet.textContent += `#chatList > div.${category} { display: none; }\n`;
            button.classList.add('off');
        }
    }

    categorizeMessage(elem: HTMLElement) {
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

    constructor() {
        super();

        for (let i = 0; i < this.categories.length; i++) {
            let category = this.categories[i];

            this.options.push(
                new Checkbox(this, {
                    name: 'Show ' + category.settName + ' messages',
                    description: '',
                    id: category.key,
                    defaultValue: true,
                    onChange: () => {
                        this.toggleCategory(
                            category.key,
                            document.getElementById(category.key) as HTMLButtonElement,
                            true
                        );
                    },
                })
            );
        }
    }

    renderer() {
        const elem = document.getElementById('chatList');
        const mock = document.createElement('div');

        window.chatList = Object.defineProperties(
            {},
            {
                childNodes: {
                    get: () =>
                        [...elem.childNodes].filter((e) =>
                            (e as HTMLElement).classList?.contains(
                                'vanillaChatMsg'
                            )
                        ),
                },
                insertAdjacentElement: {
                    value: (position: InsertPosition, element: HTMLElement) => {
                        element.classList.add('vanillaChatMsg');
                        this.categorizeMessage(element);

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

        this.injectCategories(elem);
    }
}
