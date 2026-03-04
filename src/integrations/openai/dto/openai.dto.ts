import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OpenAiChatRequestDto {
  @ApiProperty({
    description: 'Instrucción de sistema que define el comportamiento del modelo',
    example: 'Eres un asistente médico experto en radiología.',
  })
  @IsString()
  systemPrompt: string;

  @ApiProperty({
    description: 'Mensaje del usuario que el modelo debe responder',
    example: '¿Qué indican las detecciones de hdisc en una RM lumbar?',
  })
  @IsString()
  userMessage: string;
}

export class OpenAiChatResponseDto {
  @ApiProperty({ description: 'Texto generado por el modelo', example: 'Las detecciones de hdisc indican...' })
  text: string;

  @ApiProperty({ description: 'Total de tokens usados (prompt + completion)', example: 342 })
  tokensUsed: number;
}
