import { Module } from '@nestjs/common';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { RequestOrchestrator } from './request.orchestrator';

@Module({
  controllers: [RequestController],
  providers: [RequestService, RequestOrchestrator],
})
export class RequestModule {}
