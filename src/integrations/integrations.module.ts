import { Module } from '@nestjs/common';
import { DetectionModule } from './detection/detection.module';
import { OpenAiModule } from './openai/openai.module';

@Module({
  imports: [DetectionModule, OpenAiModule],
})
export class IntegrationsModule {}
