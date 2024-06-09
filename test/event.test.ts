import { isTextEvent, isReplyableEvent } from 'api/event';
import { TextMessage } from './event_message';

test('isTextEvent', () => {
    expect(isTextEvent(TextMessage)).toBeTruthy();
});

test('isReplyableEvent', () => {
    expect(isReplyableEvent(TextMessage)).toBeTruthy();
});
