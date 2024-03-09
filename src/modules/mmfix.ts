import { request } from 'https';
import { Context, RunAt } from '../context';
import Module from '../module';
import Manager from '../module/manager';
import { protocol } from 'electron';

export default class MatchmakerFix extends Module {
    enabled = true;
    id = 'mmfix';
    name = 'Matchmaker Fix';
    options = [];

    contexts = [
        {
            context: Context.Startup,
            runAt: RunAt.LoadEnd,
        },
    ];

    main() {
        if (!this.enabled) return;

        protocol.registerBufferProtocol('mmfix', (r, callback) => {
            let url = new URL(r.url);
            url.pathname = '/mm' + url.pathname;
            url.hostname = 'fra.browserfps.com';

            let req = request(
                url.href.replace('mmfix://', 'https://'),
                {
                    method: r.method,
                    headers: {
                        ...r.headers,
                        referer: 'https://fra.browserfps.com/',
                    },
                },
                (res) => {
                    let data = Buffer.alloc(0);

                    res.on(
                        'data',
                        (chunk) => (data = Buffer.concat([data, chunk]))
                    );
                    res.on('end', () => {
                        if (res.statusCode !== 200)
                            return callback({
                                data: Buffer.alloc(0),
                                statusCode: 500,
                            });

                        callback({
                            data,
                            statusCode: 200,
                        });
                    });

                    res.on('error', () => callback({ statusCode: 500 }));
                }
            );

            if (r.uploadData) {
                for (let i = 0; i < r.uploadData.length; i++)
                    req.write(r.uploadData[i]);
            }

            req.end();
            req.on('error', () => callback({ statusCode: 500 }));
        });

        Manager.registerBeforeRequestCallback((details, callback) => {
            if (!details.url) return callback({ cancel: false });
            let url = new URL(details.url);

            if (url.hostname === 'matchmaker.krunker.io') {
                return callback({
                    redirectURL:
                        'mmfix://' + url.pathname.toString() + url.search || '',
                });
            }

            return callback({ cancel: false });
        });
    }
}
