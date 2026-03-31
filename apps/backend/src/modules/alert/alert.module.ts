import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertCron } from './alert.cron';

@Module({
  providers: [AlertService, AlertCron],
  exports: [AlertService],
})
export class AlertModule {}
