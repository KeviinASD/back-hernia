import { Module } from '@nestjs/common';
import { DetectionModule } from './detection/detection.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [DetectionModule, AiModule],
})
export class IntegrationsModule {}
