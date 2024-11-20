import { ipcMain, ipcRenderer } from 'electron';
import Module from '../module';
import { WebSocket } from 'ws';
import { Context, RunAt } from '../context';
import Checkbox from '../options/checkbox';
import { waitFor } from '../util';

export default class Social extends Module {
    name = 'Social';
    id = 'social';
    readonly endpoint = new URL('wss://api.z3db0y.com/nova/ws');

    options = [
        new Checkbox(this, {
            name: 'Enabled',
            description: 'Sync custom badges & clan tags from ' + this.endpoint.hostname,
            id: 'enabled',
            defaultValue: true,
        })
    ];

    contexts = [
        {
            context: Context.Common,
            runAt: RunAt.LoadStart,
        },
        {
            context: Context.Game,
            runAt: RunAt.LoadEnd,
        },
    ];

    socket: WebSocket;
    messageQueue: any[] = [];
    users: any[] = [];
    clans: any[] = [];
    badges: any[] = [];
    centerLeaderDisplay: HTMLDivElement | null = null;
    instructionHolder: HTMLDivElement | null = null;
    endMidHolder: HTMLDivElement | null = null;

    sync(discordId: string, username: string | null, lobbyId: string) {
        this.send('sync', {
            discordId,
            username,
            lobbyId,
        });
    }

    patchScoreboards() {
        ipcRenderer.send('sync-social');

        let leaderNames = [
            ...Array.from(document.getElementsByClassName('newLeaderName')),
            ...Array.from(document.getElementsByClassName('newLeaderNameF')),
            ...Array.from(document.getElementsByClassName('newLeaderNameM')),
            ...Array.from(document.getElementsByClassName('leaderName')),
            ...Array.from(document.getElementsByClassName('leaderNameF')),
            ...Array.from(document.getElementsByClassName('leaderNameM')),
        ];

        for (let i = 0; i < leaderNames.length; i++) {
            let nameElem = leaderNames[i];

            let name = nameElem.childNodes[0]?.textContent || '';

            let clanElem = nameElem.childNodes[1];
            let clan = clanElem?.textContent || '';

            clan = clan.slice(2, -1);

            for (let i = 0; i < this.users.length; i++) {
                let user = this.users[i];
                if (user.username !== name) continue;

                this.injectBadges(nameElem, user.badges);
            }

            for (let i = 0; i < this.clans.length; i++) {
                let clanObj = this.clans[i];
                if (clanObj.name.toLowerCase() !== clan.toLowerCase()) continue;

                this.injectClan(clanElem as HTMLElement, clanObj);
            }
        }
    }

    patchEndTable() {
        let leaders = Array.from(document.getElementsByClassName('endTableN'));

        for (let i = 0; i < leaders.length; i++) {
            let leader = leaders[i] as HTMLElement;
            let name = leader.childNodes[0]?.textContent || '';

            let clanElem = leader.childNodes[1];
            let clan = clanElem?.textContent || '';

            clan = clan.slice(2, -1);

            for (let i = 0; i < this.users.length; i++) {
                let user = this.users[i];
                if (user.username !== name) continue;

                this.injectBadges(leader, user.badges, true);
            }

            for (let i = 0; i < this.clans.length; i++) {
                let clanObj = this.clans[i];
                if (clanObj.name.toLowerCase() !== clan.toLowerCase()) continue;

                this.injectClan(clanElem as HTMLElement, clanObj);
            }
        }
    }

    injectBadges(elem: Element, badges: string[], endTable = false) {
        for (let i = 0; i < badges.length; i++)
            elem.insertAdjacentHTML(
                endTable ? 'beforeend' : 'afterbegin',
                `<img class="raysBadge" src="${(
                    this.badges.find((b) => b.name === badges[i])?.image || ''
                ).replace(/"/g, '\\"')}" />`
            );
    }

    injectClan(elem: HTMLElement, clan: any) {
        switch (clan.cosmeticType) {
            case 'rgb':
                let duration = parseInt(clan.cosmetic) || 1000;

                elem.animate(
                    [
                        { color: 'crimson' },
                        { color: 'orange' },
                        { color: 'yellow' },
                        { color: 'lime' },
                        { color: 'mediumblue' },
                        { color: 'crimson' },
                    ],
                    {
                        duration,
                        iterations: Infinity,
                        iterationStart: (Date.now() % duration) / duration,
                    }
                );
                break;
            case 'color':
                elem.style.color = clan.cosmetic;
                break;
            case 'gradient':
                elem.style.setProperty('-webkit-background-clip', 'text');
                elem.style.backgroundClip = 'text';
                elem.style.color = 'transparent';
                elem.style.backgroundImage = clan.cosmetic;
                break;
            case 'image':
                elem.style.display = 'none';
                elem.insertAdjacentHTML(
                    'afterend',
                    `<img class="raysClan" src="${(clan.cosmetic || '').replace(
                        /"/g,
                        '\\"'
                    )}" />`
                );
                break;
        }
    }

    renderer() {
        this.centerLeaderDisplay = document.getElementById(
            'centerLeaderDisplay'
        ) as HTMLDivElement;

        this.instructionHolder = document.getElementById(
            'instructionHolder'
        ) as HTMLDivElement;

        this.endMidHolder = document.getElementById(
            'endMidHolder'
        ) as HTMLDivElement;

        new MutationObserver(() => this.patchScoreboards()).observe(
            this.centerLeaderDisplay,
            { childList: true }
        );

        new MutationObserver(() => this.patchScoreboards()).observe(
            this.instructionHolder,
            { attributes: true, attributeFilter: ['style'] }
        );

        waitFor(() => (window as any).GUI?.endScreen).then((endScreen: any) => {
            let orig: any;
            
            Object.defineProperty(endScreen.tabs.leaderboard, 'showTable', {
                set: v => {
                    orig = v;
                },
                get: () => {
                    return (...args: any) => {
                        let _r = orig.apply(endScreen.tabs.leaderboard, args);
                        this.patchEndTable();
                        return _r;
                    }
                }
            });
        });

        ipcRenderer.on('social-sync', (_, users, badges, clans) => {
            this.users = users;
            this.badges = badges;
            this.clans = clans;
        });
    }

    main() {
        this.connect();

        ipcMain.on('sync-social', (event) => {
            event.sender.send(
                'social-sync',
                this.users,
                this.badges,
                this.clans
            );
        });
    }

    connect() {
        if (!this.config.get('enabled', true)) {
            if (
                this.socket.readyState !== WebSocket.CLOSED &&
                this.socket.readyState !== WebSocket.CLOSING
            ) {
                this.socket.close();
            }

            this.socket = null;
            return;
        }

        if (
            this.socket &&
            (this.socket.readyState === WebSocket.OPEN ||
            this.socket.readyState == WebSocket.CONNECTING)
        ) return;

        this.socket = new WebSocket(this.endpoint);

        this.socket.on('message', (data) => {
            try {
                this.onMessage(JSON.parse(data.toString()));
            } catch {}
        });

        this.socket.on('close', () =>
            setTimeout(this.connect.bind(this), 2000)
        );

        this.socket.on('error', () => {});

        this.socket.on('open', () => {
            console.log('Social connected.');

            for (let i = 0; i < this.messageQueue.length; i++)
                this.socket.send(JSON.stringify(this.messageQueue[i]));

            this.messageQueue = [];
        });
    }

    send(event: string, ...args: any) {
        if (this.socket.readyState === WebSocket.OPEN)
            this.socket.send(JSON.stringify([event, ...args]));
        else this.messageQueue.push([event, ...args]);
    }

    onMessage(data: [string, ...any]) {
        let [event, ...args] = data;
        console.log('Social event:', event, ...args);

        switch (event) {
            case 'users':
                this.users = args[0];
                break;
            case 'clans':
                this.clans = args[0];
                break;
            case 'badges':
                this.badges = args[0];
                break;
        }
    }
}
