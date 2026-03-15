import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ExcuseController } from './excuse.controller';
import { ExcuseService } from './excuse.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ExcuseController],
  providers: [ExcuseService],
})
export class ExcuseModule {}
