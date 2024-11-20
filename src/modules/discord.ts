import Module from '../module';
import { Context, RunAt } from '../context';
import { Client } from 'discord-rpc-revamp';
import Dropdown from '../options/dropdown';
import { ipcMain, ipcRenderer, app } from 'electron';
import Checkbox from '../options/checkbox';
import Button from '../options/button';
import RPCButtonsUI from '../ui/rpcButtons';
import Social from './social';

enum RPCMode {
    GameInvite,
    Buttons,
    Off,
}

export default class Discord extends Module {
    clientId = '1210061966605815838';
    client: Client | null = null;
    updateInterval = 2000;

    buttonUI = new RPCButtonsUI(this);

    name = 'Discord';
    id = 'discord';
    options = [
        new Dropdown(this, {
            name: 'Rich Presence Mode',
            id: 'mode',
            description: 'What to display on Discord',
            options: [
                {
                    name: 'Join Game Button',
                    value: RPCMode.GameInvite,
                },
                {
                    name: 'Custom Buttons',
                    value: RPCMode.Buttons,
                },
                {
                    name: 'Off',
                    value: RPCMode.Off,
                },
            ],
        }),
        new Checkbox(this, {
            name: 'Show match info',
            id: 'matchInfo',
            description: 'Show match info on Discord',
        }),
        new Checkbox(this, {
            name: 'Show time left',
            id: 'showTime',
            description: 'Show time left on Discord',
        }),
        new Checkbox(this, {
            name: 'Show lobby size',
            id: 'showLobbySize',
            description: 'Show lobby size on Discord',
        }),
        new Checkbox(this, {
            name: 'Show user info',
            id: 'showUser',
            description: 'Show username & class on Discord',
        }),
        new Button(this, {
            name: 'Buttons',
            id: 'buttons',
            description: 'Configure buttons',
            label: 'Edit',

            onChange: this.buttonUI.open.bind(this.buttonUI),
        }),
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

    connect() {
        this.client
            .connect({ clientId: this.clientId })
            .catch(
                setTimeout.bind(
                    null,
                    this.connect.bind(this),
                    this.updateInterval
                )
            );
    }

    update(event: Electron.IpcMainEvent, activity: any) {
        let mode = this.config.get('mode', RPCMode.Off);
        let matchInfo = this.config.get('matchInfo', false);
        let showTime = this.config.get('showTime', false);
        let showUser = this.config.get('showUser', false);
        let showLobbySize = this.config.get('showLobbySize', false);

        let now = Date.now();
        const baseActivity = {
            largeImageKey: 'icon',
            largeImageText: app.getName() + ' v' + app.getVersion(),
        };

        const gameActivity = activity.id
            ? Object.assign(
                  {
                      ...baseActivity,

                      details: activity.comp
                          ? 'Competitive Game'
                          : activity.custom
                          ? 'Custom Game'
                          : 'Public Game',
                      state: matchInfo
                          ? activity.mode + ' - ' + activity.map
                          : 'Playing Krunker',
                  },
                  showTime
                      ? {
                            startTimestamp: now,
                            endTimestamp: now + activity.time * 1000,
                        }
                      : {},
                  showLobbySize
                      ? {
                            partySize: activity.players,
                            partyMax: activity.maxPlayers,
                            partyId: 'P-' + activity.id,
                        }
                      : {},
                  showUser
                      ? {
                            smallImageKey:
                                'https://assets.krunker.io/textures/classes/icon_' +
                                activity.class.index +
                                '.png',
                            smallImageText: activity.user,
                        }
                      : {}
              )
            : Object.assign({
                  ...baseActivity,

                  details: 'Not in game',
                  state: 'Idle',
              });

        switch (mode) {
            case RPCMode.GameInvite:
                console.log('Setting activity', gameActivity);

                this.client.setActivity(
                    Object.assign(gameActivity, {
                        joinSecret: activity.id,
                    })
                );
                break;
            case RPCMode.Buttons:
                let buttons = this.config.get('buttons', {}) || {};
                let parsedButtons = [];

                for (let i = 0; i < 2; i++) {
                    if (!buttons[i]) continue;
                    let button = buttons[i];
                    if (!button.label || !button.url) continue;
                    parsedButtons.push({
                        label: button.label,
                        url: button.url,
                    });
                }

                this.client
                    .setActivity(
                        Object.assign(gameActivity, {
                            buttons: parsedButtons,
                        })
                    )
                    .catch(console.error);
                break;
            case RPCMode.Off:
                this.client.clearActivity();
                break;
        }

        if (activity.id && activity.user && this.client.user?.id) {
            let social = this.manager.loaded.find(m => m instanceof Social);

            social?.sync(
                this.client.user.id,
                activity.loggedIn ? activity.user : null,
                activity.id
            );
        }
    }

    main() {
        let { window: mainWindow } = require('../main');

        this.client = new Client();
        this.connect();

        this.client.on('close', () => {
            setTimeout(() => this.connect.bind(this), this.updateInterval);
            console.error('Discord RPC disconnected. Reconnecting...');
        });

        this.client.on('ready', () => {
            this.client.subscribe('ACTIVITY_JOIN');
            console.log('Discord RPC ready.');
        });

        this.client.on('ACTIVITY_JOIN', ({ secret }) => {
            console.log('Joining game ' + secret);
            mainWindow.loadURL('https://krunker.io/?game=' + secret);
        });

        ipcMain.on('updateRPC', this.update.bind(this));
    }

    renderer(): void {
        setInterval(async function () {
            let gameActivity = window.getGameActivity() || {};
            gameActivity.comp = !(
                document.getElementById('mMenuHolComp')?.style.display == 'none'
            );

            gameActivity.loggedIn =
                document.getElementById('signedOutHeaderBar')?.style.display ==
                'none';

            if (gameActivity.id) {
                let matchInfo = await fetch(
                    'https://matchmaker.krunker.io/game-info?game=' +
                        gameActivity.id
                )
                    .then((res) => res.json())
                    .catch(() => null);
                if (matchInfo && Array.isArray(matchInfo)) {
                    gameActivity.players = matchInfo[2];
                    gameActivity.maxPlayers = matchInfo[3];
                }
            }

            ipcRenderer.send('updateRPC', gameActivity);
        }, this.updateInterval);
    }
}
