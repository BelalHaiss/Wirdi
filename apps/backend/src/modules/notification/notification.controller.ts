import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationDto, UnreadCountDto } from '@wirdi/shared';
import { User } from '../../decorators/user.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  getNotifications(@User('id') userId: string): Promise<NotificationDto[]> {
    return this.notificationService.getNotificationsForUser(userId);
  }

  @Get('unread-count')
  getUnreadCount(@User('id') userId: string): Promise<UnreadCountDto> {
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') notificationId: string,
    @User('id') userId: string
  ): Promise<NotificationDto> {
    return this.notificationService.markAsRead(notificationId, userId);
  }

  @Patch('read-all')
  markAllAsRead(@User('id') userId: string): Promise<void> {
    return this.notificationService.markAllAsRead(userId);
  }
}
