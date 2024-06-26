import { z } from './zod';
import { empty, hour_c, minute_c } from './scheme';

const rand_min = -0x1fffffffffffff;
const rand_max = 0x1fffffffffffff;

const randval_scheme = z.coerce.number().min(rand_min).max(rand_max).int();

export const args = {
    '!rand': z.tuple([randval_scheme, randval_scheme]),
    '!rsp': empty,
    '!room': empty,
    '!yn': empty,
    '!usetime': z.tuple([hour_c, minute_c, hour_c, minute_c]),
    '!now': empty,
};

export type funcs = keyof typeof args;

export const jp_funcs: Record<string, funcs> = {
    '!らん': '!rand',
    '!らんすう': '!rand',
    '!らんだむ': '!rand',

    '!じゃん': '!rsp',

    '!へや': '!room',

    '!いえの': '!yn',

    '!りようじかん': '!usetime',

    '!なう': '!now',
    '!いま': '!now',
};
