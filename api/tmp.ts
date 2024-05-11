import linebot from 'linebot';
import * as http from 'http';
import fetch from 'node-fetch';

const bot = linebot({
    channelId: process.env.CHANNEL_ID!,
    channelSecret: process.env.CHANNEL_SECRET!,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN!,
});

console.log(bot);

const server = http.createServer((req, res) => {});
server.listen();

function a() {
    return fetch('/').then((res) => res.json());
}
