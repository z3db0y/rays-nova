import ClientOption from '../options';
import { Context, RunAt } from '../context';
import config from '../config';
import Manager from './manager';

export default abstract class Module {
    manager: Manager;
    
    config = {
        get: (key: string, def: any) => config.get(`modules.${this.id}.${key}`, def),
        set: (key: string, value: any) => config.set(`modules.${this.id}.${key}`, value),
        onChange: (key: string, callback: (newValue: any, oldValue: any) => void) => config.onDidChange(`modules.${this.id}.${key}` as any, callback),
        onAnyChange: (callback: (newValue: any, oldValue: any) => void) => config.onDidChange(`modules.${this.id}` as any, callback),
        delete: (key: string) => config.delete(`modules.${this.id}.${key}` as any)
    };

    abstract name: string;
    abstract id: string;
    abstract options: ClientOption[];
    abstract contexts: {
        context: Context,
        runAt: RunAt
    }[];

    init?(ctx: Context): void;

    main?(): void;
    renderer?(ctx: Context): void;
}