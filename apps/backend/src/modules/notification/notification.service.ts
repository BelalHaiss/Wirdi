import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  NotificationType,
  SendNotificationDto,
  NOTIFICATION_CHANNEL_CONFIG,
  NotificationDto,
  UnreadCountDto,
} from '@wirdi/shared';
import {
  NOTIFICATION_CHANNEL_REGISTRY,
  type NotificationChannelRegistry,
} from './notification-channel.interface';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(NOTIFICATION_CHANNEL_REGISTRY)
    private registry: NotificationChannelRegistry,
    private db: DatabaseService
  ) {}

  async send<T extends NotificationType>(dto: SendNotificationDto<T>): Promise<void> {
    const channelKeys = NOTIFICATION_CHANNEL_CONFIG[dto.type] as readonly string[];

    await Promise.allSettled(
      channelKeys.map((key) => {
        const channel = this.registry.get(key);
        if (!channel) {
          this.logger.warn(`Channel "${key}" not registered — skipped for type "${dto.type}"`);
          return Promise.resolve();
        }
        return channel.send(dto);
      })
    );
  }

  async getNotificationsForUser(userId: string): Promise<NotificationDto[]> {
    const notifications = await this.db.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications.map((n) => ({
      id: n.id,
      recipientId: n.recipientId,
      type: n.type as NotificationType,
      payload: n.payload as any,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async getUnreadCount(userId: string): Promise<UnreadCountDto> {
    const count = await this.db.notification.count({
      where: {
        recipientId: userId,
        readAt: null,
      },
    });

    return { count };
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationDto> {
    const notification = await this.db.notification.update({
      where: {
        id: notificationId,
        recipientId: userId,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      id: notification.id,
      recipientId: notification.recipientId,
      type: notification.type as NotificationType,
      payload: notification.payload as any,
      readAt: notification.readAt ? notification.readAt.toISOString() : null,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: {
        recipientId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }
}
