import dayjs from 'dayjs';

export function time(h: number, m: number = 0, s: number = 0): dayjs.Dayjs {
    const date = dayjs().set('hour', h).set('minute', m).set('second', s);

    return date;
}
