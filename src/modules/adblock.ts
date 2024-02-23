import { Context, RunAt } from '../context';
import Module from '../module';
import Checkbox from '../options/checkbox';
import Manager from '../module/manager';
import { request } from 'https';

export default class AdBlock extends Module {
    hostsURL = 'https://blocklistproject.github.io/Lists/ads.txt';
    hosts: string[] = [];

    id = 'adblock';
    name = 'Ad Block';
    options = [
        new Checkbox(this, {
            name: 'Enabled',
            id: 'enabled',
            description: 'Blocks video and banner advertisements.'
        })
    ];

    contexts = [{
        context: Context.Startup,
        runAt: RunAt.LoadStart
    }]

    main() {
        request(this.hostsURL, async res => {
            let data = Buffer.alloc(0);
            res.on('data', chunk => data = Buffer.concat([data, chunk]));
            let fetched = await new Promise((resolve, reject) => {
                res.on('end', () => resolve(true));
                res.on('error', reject);
            }).catch(() => false);

            if (!fetched) return;
            let lines = data.toString().split('\n');

            for(let line of lines) {
                if (line.startsWith('#')) continue;
                line = line.trim();
                let [ip, host] = line.split(' ');
                if(ip !== '0.0.0.0') continue;
                this.hosts.push(host);
            }
        }).end().on('error', () => {});

        Manager.registerBeforeRequestCallback((details, callback) => {
            if(!this.config.get('enabled', false)) return callback({ cancel: false });

            let url = new URL(details.url);
            if(url.protocol !== 'http:' && url.protocol !== 'https:') return callback({ cancel: false });
            if(!this.hosts.includes(url.hostname)) return callback({ cancel: false });
            
            return callback({ cancel: true });
        });
    }
}