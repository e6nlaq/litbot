// import { faker } from '@faker-js/faker';

import case_count from './case';
import { zfill, remove_empty } from 'api/tool';

describe('zfill', () => {
    test('case', () => {
        for (let n = 1; n <= case_count; n++) {
            expect(zfill(0, n)).toBe('0'.repeat(n));
        }
    });
});

describe('remove_empty', () => {
    test('all_empty', () => {
        for (let n = 0; n <= case_count; n++) {
            expect(remove_empty(new Array<string>(n).fill(''))).toStrictEqual(
                [] as string[]
            );
        }
    });

    test('all_nonempty', () => {
        for (let n = 1; n <= case_count; n++) {
            const arr = new Array<string>(n).fill('hello');
            expect(remove_empty(arr)).toEqual(arr);
        }
    });
});
