import { Emoji } from '@line/bot-sdk/dist/messaging-api/api';

export const emojis: Record<string, Required<Omit<Emoji, 'index'>>> = {
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
    rsp_r: {
        productId: '5ac21e6c040ab15980c9b444',
        emojiId: '023',
    },
    rsp_s: {
        productId: '5ac21e6c040ab15980c9b444',
        emojiId: '025',
    },
    rsp_p: {
        productId: '5ac21e6c040ab15980c9b444',
        emojiId: '028',
    },
    yes: {
        productId: '5ac21a18040ab15980c9b43e',
        emojiId: '029',
    },
    no: {
        productId: '5ac21a18040ab15980c9b43e',
        emojiId: '030',
    },
};

export function convert_emoji(val: string): Array<Emoji> {
    const ret = Array<Emoji>(val.length);
    for (let i = 0; i < val.length; i++) {
        ret[i] = { index: i, ...emojis[val[i]] };
    }
    return ret;
}
