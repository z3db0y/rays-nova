import Performance from '../modules/performance';
import Checkbox from '../options/checkbox';
import UI from './index';

export default class SwitchesUI extends UI {
    name = '';
    categories = [{
        name: '',
        options: []
    }];

    buttons = [];

    constructor(module: Performance) {
        super(module);

        this.categories[0].options = module.switchList.map(s => new Checkbox(module, {
            id: 'switches.' + s,
            name: s.split('=')[0],
            description: '',
            defaultValue: true
        }));
    }
}