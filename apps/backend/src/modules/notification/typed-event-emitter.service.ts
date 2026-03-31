import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { NotificationEventsMap, NotificationDto } from '../notification/notification.events';

/**
 * Type-safe wrapper around EventEmitter2
 * Provides compile-time type checking for event names and payloads
 */
@Injectable()
export class TypedEventEmitter {
  constructor(private readonly emitter: EventEmitter2) {}

  /**
   * Emit a typed event
   * @example
   * this.typedEmitter.emit('notification.send', {
   *   type: 'ALERT_ASSIGNED',
   *   recipientId: userId,
   *   payload: { groupId, groupName }
   * });
   */
  emit<K extends keyof NotificationEventsMap>(
    event: K,
    payload: NotificationEventsMap[K]
  ): boolean {
    return this.emitter.emit(event, payload);
  }

  /**
   * Emit to a specific user's SSE stream
   * Dynamic event name: notification.user.{userId}
   */
  emitToUser(userId: string, payload: NotificationDto): boolean {
    return this.emitter.emit(`notification.user.${userId}`, payload);
  }

  /**
   * Listen to a typed event (use in constructor or onModuleInit)
   * @example
   * this.typedEmitter.on('notification.send', (event) => {
   *   // event is typed as NotificationEvent
   * });
   */
  on<K extends keyof NotificationEventsMap>(
    event: K,
    handler: (payload: NotificationEventsMap[K]) => void | Promise<void>
  ): this {
    this.emitter.on(event, handler as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Remove a typed event listener
   */
  off<K extends keyof NotificationEventsMap>(
    event: K,
    handler: (payload: NotificationEventsMap[K]) => void | Promise<void>
  ): this {
    this.emitter.off(event, handler as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Listen to dynamic user stream events (for SSE)
   * Returns cleanup function
   */
  onUserStream(userId: string, handler: (payload: NotificationDto) => void): () => void {
    const eventName = `notification.user.${userId}`;
    this.emitter.on(eventName, handler);
    return () => this.emitter.off(eventName, handler);
  }
}
