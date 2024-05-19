import { z } from 'zod';

export const config_scheme = z.object({
    welcome: z.boolean(),
});

export type config_type = z.infer<typeof config_scheme>;

export const default_config: config_type = {
    welcome: true,
};
