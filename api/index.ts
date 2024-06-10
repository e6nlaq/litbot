// Import all dependencies, mostly using destructuring for better view.
import {
    ClientConfig,
    MessageAPIResponseBase,
    messagingApi,
    middleware,
    MiddlewareConfig,
    webhook,
    HTTPFetchError,
    TextMessage,
} from '@line/bot-sdk';
import { Message } from '@line/bot-sdk/dist/messaging-api/api';
import express, { Application, Request, Response } from 'express';
import admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database';
import type { Reference } from '@firebase/database-types';
import { Random } from 'random-js';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import moji from 'moji';

const serviceAccount: Record<string, string> = JSON.parse(
    process.env.FIREBASE_ADMIN!
);

import { z, zod_error_message } from './zod';
import { convert_emoji, EmojiName, emojis, single_emoji } from './emoji';
import { config_type, default_config } from './config';
import { args, funcs, jp_funcs } from './args';
import {
    isJoinEvent,
    isMemberJoinedEvent,
    isTextEvent,
    isReplyableEvent,
} from './event';
import { format_arg, zfill, remove_empty } from './tool';
import { time, zone } from './date';
import { outtime } from './message';

// Setup all LINE client and Express configurations.
const clientConfig: ClientConfig = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
};

const middlewareConfig: MiddlewareConfig = {
    channelSecret: process.env.CHANNEL_SECRET || '',
};

// Firebase
const PORT = process.env.PORT || 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE,
});

const db = getDatabase();
const ref = db.ref('configs');
let config_db: Reference;
let config: config_type;

// day.js Plugin
dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault(zone);
let is_useable = true;

// Create a new LINE SDK client.
const client = new messagingApi.MessagingApiClient(clientConfig);

// Create a new Express application.
const app: Application = express();

// 時間外
let outtime_message: Message;

// Function handler to receive the text.
const textEventHandler = async (
    event: webhook.MessageEvent & {
        message: webhook.TextMessageContent;
    }
): Promise<MessageAPIResponseBase | undefined> => {
    // Process all variables here.
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
                    emojis: convert_emoji(val.split('') as EmojiName[]),
                },
            ] as TextMessage[];
        },
        '!rsp': async (_inp, _option) => {
            const rand = new Random();

            const ans =
                `rsp_${['r', 's', 'p'][rand.integer(0, 2)]}` as `rsp_${'r' | 's' | 'p'}`;
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
            ];
        },
        '!room': async (_inp, _option) => {
            return [
                `LitBot グループ情報\n` +
                    `グループID: ${(event.source as webhook.GroupSource).groupId}\n` +
                    `Config: ${JSON.stringify(config, null, 2)}`,
            ];
        },
        '!yn': async (_inp, _option) => {
            const rand = new Random();
            const ans = rand.bool() ? 'yes' : 'no';

            return [
                {
                    type: 'text',
                    text: 'Yes or No!',
                },
                {
                    type: 'text',
                    text: '$',
                    emojis: [{ ...emojis[ans], index: 0 }],
                },
            ];
        },
        '!usetime': async (inp, _option) => {
            const use_s = time(inp[0], inp[1]);
            const use_e = time(inp[2], inp[3]);

            if (use_s.isAfter(use_e)) {
                throw new Error('日付をまたいだ設定はできません。');
            }

            config = Object.assign({}, config, {
                use_sh: inp[0],
                use_sm: inp[1],
                use_eh: inp[2],
                use_em: inp[3],
            } as config_type);

            config_db.set(config);

            return [
                '使用時刻を以下の通り更新しました。',
                `${inp[0]}:${zfill(inp[1], 2)} - ${inp[2]}:${zfill(inp[3], 2)}`,
            ];
        },
        '!now': async (_inp, _option) => {
            return [dayjs().tz().format('YYYY.MM.DD HH:mm:ss.SSS')];
        },
    };

    // 半角変換
    const fixed_text = moji(event.message.text)
        .convert('ZE', 'HE')
        .convert('ZS', 'HS')
        .toString();

    const inp = remove_empty(fixed_text.split(' ')) as [funcs, ...string[]];

    if (jp_funcs[inp[0]] !== undefined) {
        inp[0] = jp_funcs[inp[0]];
    }

    if (inp[0] !== '!usetime' && !is_useable) {
        if (isReplyableEvent(event)) {
            await client.replyMessage({
                replyToken: event.replyToken,
                messages: [outtime_message],
                notificationDisabled: true,
            });
        }
        return;
    }

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
        if (err instanceof z.ZodError) {
            ret = [
                `以下のエラーが発生しました。\n` +
                    zod_error_message(err).join('\n'),
            ];
        } else ret = [`エラー ${err} が発生しました。`];
        ret.push(
            `詳しくはこちらをご覧ください: https://e6nlaq.github.io/litbot-docs/docs/${inp[0].substring(1)}`
        );
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
                messages: [...(ret as Message[])],
            });
        }
    }
};

const joinEventHandler = async (event: webhook.JoinEvent) => {
    await client.replyMessage({
        replyToken: event.replyToken as string,
        messages: [
            {
                type: 'text',
                text: '$',
                emojis: [
                    {
                        index: 0,
                        ...single_emoji('hi'),
                    },
                ],
            },
            {
                type: 'text',
                text:
                    'こんにちは! LitBot と申します!\n' +
                    'これから皆さんのお手伝いをして活躍していきますので、どうかよろしくおねがいします!',
            },
        ],
    });
};

const memberJoinedEventHandler = async (
    event: webhook.MemberJoinedEvent & { source: webhook.GroupSource }
) => {
    if (config.welcome) {
        const joinusers: string[] = [];
        for (let i = 0; i < event.joined.members.length; ++i) {
            if (event.joined.members[i].userId !== undefined) {
                joinusers.push(
                    await (
                        await client.getGroupMemberProfile(
                            event.source.groupId,
                            event.joined.members[i].userId!
                        )
                    ).displayName
                );
            }
        }

        const gruopinfo = await client.getGroupSummary(event.source.groupId);

        await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
                {
                    type: 'text',
                    text: '$',
                    emojis: [
                        {
                            index: 0,
                            ...single_emoji('hi'),
                        },
                    ],
                },
                {
                    type: 'text',
                    text:
                        `こんにちは、${joinusers.join('さん、')}さん。\n` +
                        `ようこそ、${gruopinfo.groupName}へ!`,
                },
            ],
        });
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
                    if (
                        event.source === undefined ||
                        event.source.type !== 'group'
                    ) {
                        if ('replyToken' in event) {
                            await client.replyMessage({
                                replyToken: event.replyToken as string,
                                messages: [
                                    {
                                        type: 'text',
                                        text: 'グループでのみ実行できます。',
                                    },
                                ],
                            });
                        }
                        return;
                    }
                    // 設定読み込み
                    config_db = ref.child(event.source!.groupId as string);

                    const config_raw = (await config_db.once('value')).toJSON();
                    config = Object.assign({}, default_config, config_raw);

                    // 設定更新
                    config_db.set(config);

                    // 時間制限確認
                    const use_s = time(config.use_sh, config.use_sm);
                    const use_e = time(config.use_eh, config.use_em, 59, 999);

                    is_useable = dayjs()
                        .tz()
                        .isBetween(use_s, use_e, null, '[]');
                    outtime_message = outtime(
                        config.use_sh,
                        config.use_sm,
                        config.use_eh,
                        config.use_em
                    );

                    if (isTextEvent(event)) await textEventHandler(event);
                    else if (!is_useable) {
                        if (isReplyableEvent(event)) {
                            await client.replyMessage({
                                replyToken: event.replyToken,
                                notificationDisabled: true,
                                messages: [outtime_message],
                            });
                        }
                    } else if (isJoinEvent(event))
                        await joinEventHandler(event);
                    else if (isMemberJoinedEvent(event))
                        await memberJoinedEventHandler(event);
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
