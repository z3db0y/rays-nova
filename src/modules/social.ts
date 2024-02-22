import { ipcMain, ipcRenderer } from 'electron';
import { WebSocket } from 'ws';

// Not a module itself, intertwined with discord module.
export default class Social {
    socket: WebSocket;
    messageQueue: any[] = [];
    users: any[] = [];
    clans: any[] = [];
    badges: any[] = [];
    centerLeaderDisplay: HTMLDivElement | null = null;

    sync(discordId: string, username: string | null, lobbyId: string) {
        this.send('sync', {
            discordId,
            username,
            lobbyId,
        });
    }

    patchScoreboards() {
        ipcRenderer.send('sync-social');
        console.log(
            'Patching scoreboards...',
            this.users,
            this.badges,
            this.clans
        );

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

            // TODO: Add badges/clan colors to the leaderboards
            console.log('player:', name, 'clan:', clan);

            for (let i = 0; i < this.users.length; i++) {
                let user = this.users[i];
                if (user.username !== name) continue;

                this.injectBadges(nameElem, user.badges);
            }

            for (let i = 0; i < this.clans.length; i++) {
                let clan = this.clans[i];
                if (clan.name !== clan) continue;

                this.injectClan(clanElem, clan);
            }
        }
    }

    injectBadges(elem: Element, badges: string[]) {
        for (let i = 0; i < badges.length; i++) {
            let img = document.createElement('img');
            img.src = this.badges.find((b) => b.name === badges[i])?.url;

            if (!img.src) return;

            img.style.height = '15px';
            elem.insertAdjacentElement('afterbegin', img);
        }
    }

    injectClan(elem: ChildNode, clan: any) {}

    renderer() {
        this.centerLeaderDisplay = document.getElementById(
            'centerLeaderDisplay'
        ) as HTMLDivElement;

        new MutationObserver(() => this.patchScoreboards()).observe(
            this.centerLeaderDisplay,
            { childList: true }
        );

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
        this.socket = new WebSocket('wss://api.z3db0y.com/nova/ws');

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
        console.log('Social event:', event, args);

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
