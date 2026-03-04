import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TranscribeRequestDto {
  @ApiPropertyOptional({ description: 'Modelo de transcripción', example: 'whisper-small' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Código de idioma (ej. es, en)', example: 'es' })
  @IsOptional()
  @IsString()
  language?: string;
}

export class TranscribeResponseDto {
  @ApiProperty({ description: 'Texto transcrito' })
  transcript: string;

  @ApiPropertyOptional({ description: 'Idioma detectado o usado', example: 'es' })
  language?: string;

  @ApiPropertyOptional({ description: 'Duración de audio en segundos', example: 12.3 })
  duration_s?: number;
}
