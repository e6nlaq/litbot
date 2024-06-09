import { Message } from '@line/bot-sdk/dist/messaging-api/api';
import { single_emoji } from './emoji';
import { zfill } from './tool';

export function outtime(
    sh: number,
    sm: number,
    eh: number,
    em: number
): Message {
    const sm_s = zfill(sm, 2);
    const em_s = zfill(em, 2);

    return {
        type: 'text',
        text:
            '$時間外です!\n' +
            `利用時間は、 ${sh}:${sm_s}~${eh}:${em_s} となっています。`,
        emojis: [
            {
                index: 0,
                ...single_emoji('police'),
            },
        ],
    };
}
