import { Context, RunAt } from '../context';
import Module from '../module';
import { app, ipcRenderer, ipcMain, session } from 'electron';
import { encrypt } from './altmanager';
import Checkbox from '../options/checkbox';
import Dropdown from '../options/dropdown';
import TextInput from '../options/textinput';

enum ProxyProtocol {
    HTTP,
    HTTPS,
    SOCKS4,
    SOCKS5,
}

export default class Proxy extends Module {
    name = 'Proxy';
    id = 'proxy';
    
    options = [
        new Checkbox(this, {
            name: 'Enabled',
            id: 'enabled',
            description: 'Tunnel client requests through a proxy server.',
        }),
        new Dropdown(this, {
            name: 'Protocol',
            id: 'protocol',
            description: 'The type of the proxy server.',
            options: [
                {
                    name: 'HTTP',
                    value: ProxyProtocol.HTTP,
                },
                {
                    name: 'HTTPS',
                    value: ProxyProtocol.HTTPS,
                },
                {
                    name: 'SOCKS v4',
                    value: ProxyProtocol.SOCKS4,
                },
                {
                    name: 'SOCKS v5',
                    value: ProxyProtocol.SOCKS5,
                },
            ],
        }),
        new TextInput(this, {
            name: 'Host',
            id: 'host',
            description: 'The address of the proxy server.',
            label: '0.0.0.0',
        }),
        new TextInput(this, {
            name: 'Port',
            id: 'port',
            description: 'The port of the proxy server.',
            label: '8000',
            type: 'number',
        }),
        new TextInput(this, {
            name: 'Username',
            id: 'username',
            description: '(Optional) Proxy authorization.',
            label: '',
        }),
        new TextInput(this, {
            name: 'Password',
            id: 'password',
            description: '(Optional) Proxy authorization.',
            label: '',
            type: 'password',
            onChange: (value) => this.config.set('password', encrypt(value))
        }),
    ];

    contexts = [
        {
            context: Context.Startup,
            runAt: RunAt.LoadEnd,
        },
        {
            context: Context.Game,
            runAt: RunAt.LoadEnd,
        }
    ];

    readonly protocolSchemes = ['http', 'https', 'socks4', 'socks5'];

    main() {
        app.on('login', (event, __, ___, { isProxy }, callback) => {
            let enabled = this.config.get('enabled', false);
            let username = this.config.get('username', '');
            let password = this.config.get('password', '');

            if (!isProxy || !enabled) return;
            event.preventDefault();

            callback(username, encrypt(password));
        });

        ipcMain.on('updateProxy', (_, proxy) => this.updateProxy(proxy));
        ipcMain.on('disableProxy', () => {
            this.config.set('enabled', false);
            this.updateProxy();
        });
        
        this.updateProxy();
    }

    renderer() {
        this.config.onAnyChange((proxy, _) => ipcRenderer.send('updateProxy', proxy));
    }

    updateProxy(proxy?: any) {
        let {
            enabled,
            host,
            port,
            protocol,
        } = proxy ?? {};

        enabled ??= this.config.get('enabled', false);
        host ??= this.config.get('host', '');
        port ??= this.config.get('port', 8080);
        protocol ??= this.config.get('protocol', ProxyProtocol.HTTP);

        if (!enabled) return session.defaultSession.setProxy({ proxyRules: '' });

        try {
            let url = new URL(this.protocolSchemes[protocol] + '://' + host + ':' + port);
            url.pathname = '';

            session.defaultSession.setProxy({ proxyRules: url.toString().slice(0, -1) });
        } catch {
            // Disable proxy
            session.defaultSession.setProxy({ proxyRules: '' });
        }
    }
}
