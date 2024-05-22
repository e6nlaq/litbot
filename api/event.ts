/* eslint-disable @typescript-eslint/no-explicit-any */

import { webhook } from '@line/bot-sdk';

export function isTextEvent(
    event: any
): event is webhook.MessageEvent & { message: webhook.TextMessageContent } {
    return (
        event.type === 'message' &&
        event.message &&
        event.message.type === 'text'
    );
}

export function isJoinEvent(event: any): event is webhook.JoinEvent {
    return event.type === 'join';
}

export function isMemberJoinedEvent(
    event: any
): event is webhook.MemberJoinedEvent & { source: webhook.GroupSource } {
    return event.type === 'memberJoined';
}
