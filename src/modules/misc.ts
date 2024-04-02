import { Context, RunAt } from '../context';
import Module from '../module';
import Checkbox from '../options/checkbox';

export default class Chat extends Module {
    name = 'Miscellaneous';
    id = 'misc';
    options = [
        new Checkbox(this, {
            name: 'Show client watermark',
            description: '',
            id: 'watermark',
            onChange(value) {
                document.body.style.setProperty(
                    '--watermark-display',
                    value ? '' : 'none'
                );
            },
            defaultValue: true,
        }),
    ];

    contexts = [
        {
            context: Context.Game,
            runAt: RunAt.LoadEnd,
        },
    ];

    renderer(ctx: Context): void {}
}
