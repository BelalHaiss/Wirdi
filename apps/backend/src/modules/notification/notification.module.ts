import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { InAppNotificationChannel } from './channels/in-app.channel';
import {
  INotificationChannel,
  NotificationChannelRegistry,
  NOTIFICATION_CHANNEL_REGISTRY,
} from './notification-channel.interface';

@Module({
  controllers: [NotificationController],
  providers: [
    InAppNotificationChannel,
    // PushNotificationChannel,   ← add here when ready
    // EmailNotificationChannel,  ← add here when ready
    {
      provide: NOTIFICATION_CHANNEL_REGISTRY,
      useFactory: (...channels: INotificationChannel[]): NotificationChannelRegistry => {
        return new Map<string, INotificationChannel>([
          ['IN_APP', channels[0]],
          // ['PUSH',   channels[1]],
          // ['EMAIL',  channels[2]],
        ]);
      },
      inject: [InAppNotificationChannel],
    },
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
