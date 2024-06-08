import { z } from './zod';
import { empty, hour, minute } from './scheme';

const rand_min = -0x1fffffffffffff;
const rand_max = 0x1fffffffffffff;

const randval_scheme = z.coerce.number().min(rand_min).max(rand_max).int();

export const args = {
    '!rand': z.tuple([randval_scheme, randval_scheme]),
    '!rsp': empty,
    '!room': empty,
    '!yn': empty,
    '!usetime': z.tuple([hour, minute, hour, minute]),
};

export type funcs = keyof typeof args;
