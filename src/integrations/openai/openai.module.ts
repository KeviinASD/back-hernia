import { Module } from '@nestjs/common';
import { OpenAiService } from './services/openai.service';
import { OpenAiController } from './controllers/openai.controller';

@Module({
  controllers: [OpenAiController],
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class OpenAiModule {}
