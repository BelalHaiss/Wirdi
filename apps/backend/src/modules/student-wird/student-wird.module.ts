import { Module } from '@nestjs/common';
import { StudentWirdController } from './student-wird.controller';
import { StudentWirdService } from './student-wird.service';

@Module({
  imports: [],
  controllers: [StudentWirdController],
  providers: [StudentWirdService],
  exports: [StudentWirdService],
})
export class StudentWirdModule {}
