import { Context, RunAt } from '../context';
import Module from '../module';

export default class Twitch extends Module {
    oauthURI = 'https://id.twitch.tv/oauth2/authorize';
    tokenURI = 'https://id.twitch.tv/oauth2/token';
    scopes = [
        'moderator:manage:chat_messages',
        'chat:read',
        'chat:edit',
        'channel:moderate',
        'channel:read:redemptions',
    ];

    id = 'twitch';
    name = 'Twitch';
    options = [];

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

    main() {}

    refreshToken() {}

    getTokenFromCode() {}

    login() {}
}
