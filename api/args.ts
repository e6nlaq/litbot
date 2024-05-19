import { z } from 'zod';

const rand_min = -0x1fffffffffffff;
const rand_max = 0x1fffffffffffff;

const randval_scheme = z.coerce.number().min(rand_min).max(rand_max).int();
const empty = z.string().array().length(0);

export const args = {
    '!rand': z.tuple([randval_scheme, randval_scheme]),
    '!rsp': empty,
    '!room': empty,
};

export type funcs = keyof typeof args;
