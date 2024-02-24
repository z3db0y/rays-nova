import { Context, RunAt } from '../context';
import Module from '../module';
import Dropdown from '../options/dropdown';

export default class Launcher extends Module {
    id = 'launcher';
    name = 'Launcher settings';
    options = [
        new Dropdown(this, {
            name: 'Launch mode',
            description:
                'Whether to show a launcher or splash screen on client start.',
            id: 'mode',
            options: [
                {
                    name: 'Splash screen',
                    value: 0,
                },
                {
                    name: 'Launcher',
                    value: 1,
                },
            ],
        }),
    ];

    contexts = [
        {
            context: Context.Game,
            runAt: RunAt.LoadStart,
        },
    ];
}
