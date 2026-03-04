import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OpenAiService } from '../services/openai.service';
import { OpenAiChatRequestDto, OpenAiChatResponseDto } from '../dto/openai.dto';

@ApiTags('Integrations - OpenAI')
@ApiBearerAuth()
@Controller('integrations/openai')
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @Post('chat')
  @ApiOperation({
    summary: 'Chat con GPT-4o',
    description:
      'Envía un prompt de sistema y un mensaje de usuario a GPT-4o. ' +
      'Devuelve la respuesta generada y la cantidad de tokens consumidos.',
  })
  @ApiResponse({ status: 201, description: 'Respuesta generada exitosamente', type: OpenAiChatResponseDto })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 500, description: 'Error al llamar a la API de OpenAI' })
  async chat(@Body() body: OpenAiChatRequestDto): Promise<OpenAiChatResponseDto> {
    return this.openAiService.call(body.systemPrompt, body.userMessage);
  }
}
