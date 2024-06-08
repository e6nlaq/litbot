import { z } from './zod';

export const empty = z.string().array().length(0);

export const hour = z.number().min(0).max(23);
export const minute = z.number().min(0).max(59);
