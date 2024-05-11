import { Emoji } from '@line/bot-sdk/dist/messaging-api/api';

const emojis: Record<string, Omit<Emoji, 'index'>> = {
    '1': {
        productId: '5ac21a8c040ab15980c9b43f',
        emojiId: '053',
    },
    '2': {
        productId: '5ac21a8c040ab15980c9b43f',
        emojiId: '054',
    },
    '3': {
        productId: '5ac21a8c040ab15980c9b43f',
        emojiId: '055',
    },

    '4': {
        productId: '5ac21a8c040ab15980c9b43f',
        emojiId: '056',
    },
    '5': {
        productId: '5ac21a8c040ab15980c9b43f',
        emojiId: '057',
    },
    '6': {
        productId: '5ac21a8c040ab15980c9b43f',
        emojiId: '058',
    },
    '7': {
        productId: '5ac21a8c040ab15980c9b43f',
        emojiId: '059',
    },
    '8': {
        productId: '5ac21a8c040ab15980c9b43f',
        emojiId: '060',
    },
    '9': {
        productId: '5ac21a8c040ab15980c9b43f',
        emojiId: '061',
    },
    '0': {
        productId: '5ac21a8c040ab15980c9b43f',
        emojiId: '062',
    },
    '-': {
        productId: '5ac21a8c040ab15980c9b43f',
        emojiId: '102',
    },
    '.': {
        productId: '5ac21a8c040ab15980c9b43f',
        emojiId: '094',
    },
};

export default function convert_emoji(val: string): Array<Emoji> {
    const ret = Array<Emoji>(val.length);
    for (let i = 0; i < val.length; i++) {
        ret[i] = { index: i, ...emojis[val[i]] };
    }
    return ret;
}
