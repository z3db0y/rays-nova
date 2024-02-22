import { Context } from '../context';

export default abstract class Preload {
    abstract context: Context;
    onLoadStart?(): void;
    onLoadEnd?(): void;
}