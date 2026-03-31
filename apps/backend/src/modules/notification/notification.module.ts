import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { InAppNotificationChannel } from './channels/in-app.channel';
import { TypedEventEmitter } from './typed-event-emitter.service';
import {
  INotificationChannel,
  NotificationChannelRegistry,
  NOTIFICATION_CHANNEL_REGISTRY,
} from './notification-channel.interface';

/**
 * Global notification module
 * Provides TypedEventEmitter for type-safe event dispatch across the app
 * Import once in AppModule, inject TypedEventEmitter anywhere
 */
@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [NotificationController],
  providers: [
    TypedEventEmitter,
    InAppNotificationChannel,
    {
      provide: NOTIFICATION_CHANNEL_REGISTRY,
      useFactory: (...channels: INotificationChannel[]): NotificationChannelRegistry => {
        return new Map<string, INotificationChannel>([['IN_APP', channels[0]]]);
      },
      inject: [InAppNotificationChannel],
    },
    NotificationService,
  ],
  exports: [TypedEventEmitter, NotificationService],
})
export class NotificationModule {}
