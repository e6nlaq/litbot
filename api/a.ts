import express, { Application, Request, Response } from 'express';
import linebot from 'linebot';

declare module 'linebot';

const bot = linebot({
    channelId: process.env.CHANNEL_ID!,
    channelSecret: process.env.CHANNEL_SECRET!,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN!,
});

const app: Application = express();

function getRandom(min: number, max: number) {
    let random = Math.floor(Math.random() * (max + 1 - min)) + min;

    return random;
}

const linebotParser = bot.parser();

app.get('/', async (_: Request, res: Response): Promise<Response> => {
    return res.status(200).json({
        status: 'success',
        message: 'Connected successfully!',
    });
});
app.post('/', linebotParser);

bot.on('message', function (event) {
    if (event.message.type !== 'text') return;

    if (event.message.text === '!dice') {
        event.reply(['サイコロを振ります!', String(getRandom(1, 6))]);
    }
});

app.listen(process.env.PORT || 80, function () {
    console.log('LineBot is running.');
});
