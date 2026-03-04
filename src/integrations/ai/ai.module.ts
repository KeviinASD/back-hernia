import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  controllers: [AiController],
  providers: [OpenAiProvider],
  exports: [OpenAiProvider],
})
export class AiModule {}
