// Import all dependencies, mostly using destructuring for better view.
import {
    ClientConfig,
    MessageAPIResponseBase,
    messagingApi,
    middleware,
    MiddlewareConfig,
    webhook,
    HTTPFetchError,
    Message,
    TextMessage,
} from '@line/bot-sdk';
import express, { Application, Request, Response } from 'express';
import admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database';
import type { Reference } from '@firebase/database-types';
import { z } from './zod';

const serviceAccount: Record<string, string> = JSON.parse(
    process.env.FIREBASE_ADMIN!
);

import { Random } from 'random-js';
import { convert_emoji, emojis } from './emoji';
import { config_type, default_config } from './config';
import { args, funcs } from './args';

// Setup all LINE client and Express configurations.
const clientConfig: ClientConfig = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
};

const middlewareConfig: MiddlewareConfig = {
    channelSecret: process.env.CHANNEL_SECRET || '',
};

const PORT = process.env.PORT || 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE,
});

const db = getDatabase();
const ref = db.ref('configs');
let config_db: Reference;

// Create a new LINE SDK client.
const client = new messagingApi.MessagingApiClient(clientConfig);

// Create a new Express application.
const app: Application = express();

const isTextEvent = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any
): event is webhook.MessageEvent & { message: webhook.TextMessageContent } => {
    return (
        event.type === 'message' &&
        event.message &&
        event.message.type === 'text'
    );
};

function format_arg(arg: string[]): [string[], Set<string>] {
    const dat = new Set<string>();
    const list: string[] = [];
    for (let i = 1; i < arg.length; ++i) {
        if (arg[i][0] !== '/') list.push(arg[i]);
        else dat.add(arg[i]);
    }

    return [list, dat];
}

// Function handler to receive the text.
const textEventHandler = async (
    event: webhook.Event
): Promise<MessageAPIResponseBase | undefined> => {
    // Process all variables here.
    if (!isTextEvent(event)) {
        return;
    }

    if (event.source!.type !== 'group') {
        await client.replyMessage({
            replyToken: event.replyToken as string,
            messages: [
                {
                    type: 'text',
                    text: 'グループからのみ実行できます。',
                },
            ],
        });
        return;
    }
    config_db = ref.child((event.source as webhook.GroupSource).groupId);

    const config_raw = (await config_db.once('value')).toJSON();
    const config: config_type = Object.assign({}, default_config, config_raw);

    // 設定更新
    config_db.set(config);

    type funcs_type = {
        [K in funcs]: (
            inp: z.infer<(typeof args)[K]>,
            option: Set<string>
        ) => Promise<string[] | Message[]>;
    };

    // type inp_type = z.infer<(typeof args)[funcs]>;
    const funcs: funcs_type = {
        '!rand': async (inp, option) => {
            const rand = new Random();
            const val = rand.integer(inp[0], inp[1]).toString();

            if (val.length > 20) {
                option.add('/a');
            }

            if (option.has('/a')) {
                return [`${inp[0]}~${inp[1]}の中のランダムな数値!`, val];
            }

            return [
                {
                    type: 'text',
                    text: `${inp[0]}~${inp[1]}の中のランダムな数値!`,
                },
                {
                    type: 'text',
                    text: '$'.repeat(val.length),
                    emojis: convert_emoji(val),
                },
            ] as TextMessage[];
        },
        '!rsp': async (_inp, _option) => {
            const rand = new Random();

            const ans = `rsp_${['r', 's', 'p'][rand.integer(0, 2)]}`;
            return [
                {
                    type: 'text',
                    text: 'じゃんけんぽん!',
                },
                {
                    type: 'text',
                    text: '$',
                    emojis: [{ ...emojis[ans], index: 0 }],
                },
            ] as TextMessage[];
        },
        '!room': async (_inp, _option) => {
            return [
                `LitBot グループ情報\n` +
                    `グループID: ${(event.source as webhook.GroupSource).groupId}\n` +
                    `Config: ${JSON.stringify(config, null, 2)}`,
            ];
        },
    };

    const inp = event.message.text.split(' ') as [funcs, ...string[]];

    if (funcs[inp[0]] === undefined) {
        return;
    }

    let ret: string[] | Message[] = [];
    try {
        const formated_inp = format_arg(inp);

        // type command_type<T in funcs> = (typeof funcs)[T];
        // const command: command_type<(typeof inp)[0]>;

        ret = await funcs[inp[0]](
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            args[inp[0]].parse(formated_inp[0]) as any,
            formated_inp[1]
        );
    } catch (err) {
        ret = [`エラー ${err} が発生しました。`];
    } finally {
        // Process all message related variables here.
        // Create a new message.
        // Reply to the user.

        if (typeof ret[0] === 'string') {
            await client.replyMessage({
                replyToken: event.replyToken as string,
                messages: (ret as string[]).map((message) => {
                    return { type: 'text', text: message };
                }),
            });
        } else {
            await client.replyMessage({
                replyToken: event.replyToken as string,
                messages: ret as Message[],
            });
        }
    }
};

// Register the LINE middleware.
// As an alternative, you could also pass the middleware in the route handler, which is what is used here.
// app.use(middleware(middlewareConfig));

// Route handler to receive webhook events.
// This route is used to receive connection tests.
app.get('/', async (_: Request, res: Response): Promise<Response> => {
    return res.status(200).json({
        status: 'success',
        message: 'Connected successfully!',
    });
});

// This route is used for the Webhook.
app.post(
    '/',
    middleware(middlewareConfig),
    async (req: Request, res: Response): Promise<Response> => {
        const callbackRequest: webhook.CallbackRequest = req.body;
        const events: webhook.Event[] = callbackRequest.events!;

        // Process all the received events asynchronously.
        const results = await Promise.all(
            events.map(async (event: webhook.Event) => {
                try {
                    await textEventHandler(event);
                } catch (err: unknown) {
                    if (err instanceof HTTPFetchError) {
                        console.error(err.status);
                        console.error(err.headers.get('x-line-request-id'));
                        console.error(err.body);
                    } else if (err instanceof Error) {
                        console.error(err);
                    }

                    // Return an error message.
                    return res.status(500).json({
                        status: 'error',
                    });
                }
            })
        );

        // Return a successful message.
        return res.status(200).json({
            status: 'success',
            results,
        });
    }
);

// Create a server and listen to it.
app.listen(PORT, () => {
    console.log(`Application is live and listening on port ${PORT}`);
});
