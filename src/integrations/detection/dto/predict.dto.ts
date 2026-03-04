import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Request DTOs ──────────────────────────────────────────────────────────────

export class PredictRequestDto {
  @ApiProperty({ description: 'Nombre del modelo a usar', example: 'yolo-hernia-v1' })
  @IsString()
  model: string;

  @ApiPropertyOptional({ description: 'Umbral de confianza (0–1)', default: 0.25, minimum: 0, maximum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  conf?: number = 0.25;

  @ApiPropertyOptional({ description: 'Umbral IoU para NMS (0–1)', default: 0.45, minimum: 0, maximum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  iou?: number = 0.45;
}

export class PredictAllRequestDto {
  @ApiPropertyOptional({ description: 'Umbral de confianza (0–1)', default: 0.25, minimum: 0, maximum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  conf?: number = 0.25;

  @ApiPropertyOptional({ description: 'Umbral IoU para NMS (0–1)', default: 0.45, minimum: 0, maximum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  iou?: number = 0.45;
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

export class DetectionDto {
  @ApiProperty({ description: '1 = disc | 2 = hdisc', example: 2 })
  label_id: number;

  @ApiProperty({ description: '"disc" | "hdisc"', example: 'hdisc' })
  label_name: string;

  @ApiProperty({ description: 'Confianza de la detección (0–1)', example: 0.87 })
  confidence: number;

  @ApiProperty({ description: 'Bounding box [x1, y1, x2, y2] en píxeles', example: [120, 200, 300, 380] })
  bbox: number[];
}

export class PredictResponseDto {
  @ApiProperty({ example: 'yolo-hernia-v1' })
  model_used: string;

  @ApiProperty({ description: 'Tiempo de inferencia en segundos', example: 0.312 })
  inference_time_s: number;

  @ApiProperty({ description: 'Total de detecciones', example: 3 })
  n_total: number;

  @ApiProperty({ description: 'Detecciones con label hdisc', example: 1 })
  n_hernias: number;

  @ApiProperty({ description: 'Confianza media de todas las detecciones', example: 0.79 })
  avg_confidence: number;

  @ApiProperty({ description: 'Indica si se detectó al menos una hernia', example: true })
  hernia_detected: boolean;

  @ApiProperty({ type: [DetectionDto] })
  detections: DetectionDto[];

  @ApiProperty({ description: 'Imagen PNG anotada en Base64' })
  annotated_image_b64: string;
}

export class ModelResultDto {
  @ApiProperty({ example: 'yolo-hernia-v1' })
  model_used: string;

  @ApiProperty({ example: 0.298 })
  inference_time_s: number;

  @ApiProperty({ example: 3 })
  n_total: number;

  @ApiProperty({ example: 1 })
  n_hernias: number;

  @ApiProperty({ example: 0.81 })
  avg_confidence: number;

  @ApiProperty({ example: true })
  hernia_detected: boolean;

  @ApiProperty({ type: [DetectionDto] })
  detections: DetectionDto[];

  @ApiProperty({ description: 'Imagen PNG anotada en Base64' })
  annotated_image_b64: string;

  @ApiPropertyOptional({ description: 'Mensaje de error si el modelo falló', nullable: true, example: null })
  error: string | null;
}

export class PredictAllResponseDto {
  @ApiProperty({ description: 'Cantidad de modelos ejecutados', example: 3 })
  total_models_run: number;

  @ApiProperty({ description: 'Modelos que detectaron hernia', example: 2 })
  models_detecting_hernia: number;

  @ApiProperty({ description: 'Mayoría de modelos detectó hernia', example: true })
  consensus_hernia: boolean;

  @ApiProperty({ description: 'Tiempo total acumulado de inferencia', example: 0.94 })
  total_inference_time_s: number;

  @ApiProperty({ type: [ModelResultDto] })
  results: ModelResultDto[];
}
