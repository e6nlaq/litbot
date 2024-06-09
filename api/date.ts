import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault('Asia/Tokyo');

export const zone = 'Asia/Tokyo';

export function time(
    h: number,
    m: number = 0,
    s: number = 0,
    ms: number = 0
): dayjs.Dayjs {
    const date = dayjs()
        .tz()
        .set('hour', h)
        .set('minute', m)
        .set('second', s)
        .set('milliseconds', ms);

    return date;
}
