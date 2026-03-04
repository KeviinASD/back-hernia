import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OpenAiProvider } from './providers/openai.provider';
import { AiChatRequestDto, AiChatResponseDto } from './dto/ai.dto';

@ApiTags('Integrations - AI')
@ApiBearerAuth()
@Controller('integrations/ai')
export class AiController {
  constructor(private readonly openAiProvider: OpenAiProvider) {}

  @Post('chat')
  @ApiOperation({
    summary: 'Chat con GPT-4o (OpenAI)',
    description:
      'Envía un prompt de sistema y un mensaje de usuario a GPT-4o. ' +
      'Devuelve la respuesta generada y la cantidad de tokens consumidos.',
  })
  @ApiResponse({ status: 201, description: 'Respuesta generada exitosamente', type: AiChatResponseDto })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 500, description: 'Error al llamar a la API de OpenAI' })
  async chat(@Body() body: AiChatRequestDto): Promise<AiChatResponseDto> {
    return this.openAiProvider.call(body.systemPrompt, body.userMessage);
  }
}
