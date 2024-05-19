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

const serviceAccount: Record<string, string> = JSON.parse(
    process.env.FIREBASE_ADMIN!
);

import { Random } from 'random-js';
import { convert_emoji, emojis } from './emoji';

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
let config: Reference;

// Create a new LINE SDK client.
const client = new messagingApi.MessagingApiClient(clientConfig);

// Create a new Express application.
const app: Application = express();

const isTextEvent = (
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
    }
    config = ref.child((event.source as webhook.GroupSource).groupId);

    const funcs: Record<
        string,
        (inp: string[], option: Set<string>) => Promise<string[] | Message[]>
    > = {
        '!rand': async (inp, option) => {
            const rand = new Random();
            if (inp.length === 2) {
                const val = rand
                    .integer(Number(inp[0]), Number(inp[1]))
                    .toString();

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
            } else {
                return ['引数は二つ必要です。'];
            }
        },
        '!rsp': async (inp, option) => {
            if (inp.length === 0) {
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
            } else {
                return ['余分な引数が含まれています(引数は0個)'];
            }
        },
    };

    const inp = event.message.text.split(' ');

    if (funcs[inp[0]] === undefined) {
        return;
    }

    let ret: string[] | Message[] = [];
    try {
        ret = await funcs[inp[0]](...format_arg(inp));
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
