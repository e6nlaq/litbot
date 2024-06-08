import { z } from './zod';

export const empty = z.string().array().length(0);

export const hour = z.number().min(0).max(23);
export const hour_c = z.coerce.number().min(0).max(23);

export const minute = z.number().min(0).max(59);
export const minute_c = z.coerce.number().min(0).max(59);
