import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { OpenAiProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  controllers: [AiController],
  providers: [OpenAiProvider, GeminiProvider],
  exports: [OpenAiProvider, GeminiProvider],
})
export class AiModule {}
