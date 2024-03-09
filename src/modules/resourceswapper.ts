import { app, protocol } from 'electron';
import { Context, RunAt } from '../context';
import Module from '../module';
import Manager from '../module/manager';
import { join } from 'path';
import { existsSync, statSync, mkdirSync } from 'fs';
import Checkbox from '../options/checkbox';

export default class ResourceSwapper extends Module {
    id = 'resourceswapper';
    name = 'Resource Swapper';
    path: string;

    contexts = [
        {
            context: Context.Startup,
            runAt: RunAt.LoadEnd,
        },
    ];

    options = [
        new Checkbox(this, {
            name: 'Enabled',
            description:
                'Swaps game resources with ones from the resource swapper folder.',
            id: 'enabled',
        }),
    ];

    main() {
        this.path = join(app.getPath('documents'), 'KrunkerResourceSwapper');

        protocol.registerFileProtocol('client-swapper', (request, callback) => {
            let url = new URL(request.url);
            callback({ path: join(this.path, url.pathname) });
        });

        Manager.registerBeforeRequestCallback((details, callback) => {
            if (!this.config.get('enabled', false))
                return callback({ cancel: false });
            if (!existsSync(this.path))
                mkdirSync(this.path, { recursive: true });
            if (!details.url) return callback({ cancel: false });

            let url = new URL(details.url);
            if (
                url.hostname !== 'krunker.io' ||
                !existsSync(join(this.path, url.pathname)) ||
                !statSync(join(this.path, url.pathname)).isFile()
            )
                return callback({ cancel: false });

            return callback({
                redirectURL: 'client-swapper://' + url.pathname,
            });
        });
    }
}
