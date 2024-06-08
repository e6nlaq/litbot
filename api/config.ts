import { z } from './zod';
import { hour, minute } from './scheme';

export const config_scheme = z.object({
    welcome: z.boolean(),
    use_sh: hour,
    use_sm: minute,
    use_eh: hour,
    use_em: minute,
});

export type config_type = z.infer<typeof config_scheme>;

export const default_config: config_type = {
    welcome: true,
    use_sh: 0,
    use_sm: 0,
    use_eh: 23,
    use_em: 59,
};
