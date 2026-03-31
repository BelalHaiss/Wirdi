import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsOrchestrator } from './stats.orchestrator';

@Module({
  controllers: [StatsController],
  providers: [StatsOrchestrator],
})
export class StatsModule {}
