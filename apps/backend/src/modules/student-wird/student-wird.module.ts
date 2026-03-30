import { Module } from '@nestjs/common';
import { StudentWirdController } from './student-wird.controller';
import { StudentWirdService } from './student-wird.service';
import { AlertModule } from '../alert/alert.module';

@Module({
  imports: [AlertModule],
  controllers: [StudentWirdController],
  providers: [StudentWirdService],
  exports: [StudentWirdService],
})
export class StudentWirdModule {}
