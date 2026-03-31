import { Module } from '@nestjs/common';
import { ExcuseController } from './excuse.controller';
import { ExcuseService } from './excuse.service';

@Module({
  controllers: [ExcuseController],
  providers: [ExcuseService],
})
export class ExcuseModule {}
