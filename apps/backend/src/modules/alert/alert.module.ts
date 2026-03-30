import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertCron } from './alert.cron';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [AlertService, AlertCron],
  exports: [AlertService],
})
export class AlertModule {}
