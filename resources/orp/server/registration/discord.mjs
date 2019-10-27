import * as alt from 'alt';
import { get, request } from 'https';
import SQL from '../../../postgres-wrapper/database.mjs';
import { Config } from '../configuration/config.mjs';
import * as cache from '../cache/cache.mjs';

const db = new SQL(); // Get DB Reference

alt.onClient('discord:Authorization', async (player, object) => {
    const result = await new Promise(resolve => {
        get(
            'https://discordapp.com/api/users/@me',
            {
                headers: {
                    Authorization: `Bearer ${object.token}`
                }
            },
            res => {
                res.on('data', d => {
                    resolve({ statusCode: res.statusCode, data: d.toString() });
                });
            }
        ).on('error', e => {
            return resolve({ statusCode: e.statusCode, data: '' });
        });
    });

    if (result.statusCode !== 200) {
        alt.emitClient(player, 'discord:AuthorizationFailure');
        return;
    }

    console.log(object);

    const revoke = await new Promise(resolve => {
        /*
        request('https://discordapp.com/api/oauth2/token/revoke', {
            headers: {
                method: 'POST',
                Authorization: `Bearer ${bearerToken}`
            }
        });

        
        request(
            'https://discordapp.com/api/oauth2/token/revoke',
            {
                headers: {
                    token: `Bearer ${bearerToken}`
                }
            },
            res => {
                res.on('data', d => {
                    return resolve(d);
                });
            }
        ).on('error', e => {
            return resolve(e);
        });
        */

        resolve();
    });

    //console.log(revoke.toString());

    const userData = JSON.parse(result.data);
    const account = cache.getAccount(userData.id);

    console.log(userData);

    if (account) {
        alt.emit('orp:Login', player, account.id, userData.id);
        return;
    }

    db.upsertData({ userid: userData.id }, 'Account', res => {
        cache.cacheAccount(res.userid, res.id);
        alt.emit('orp:Register', player, res.id, userData.id);
        alt.emit('orp:Login', player, res.id, userData.id);
    });
});
