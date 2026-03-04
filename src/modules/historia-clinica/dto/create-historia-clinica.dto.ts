import {
  IsBoolean, IsEnum, IsOptional, IsInt,
  IsArray, IsString, Min, Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateHistoriaClinicaDto {

  // ── Comorbilidades ───────────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  diabetes?: boolean;

  @ApiPropertyOptional({ enum: ['tipo1', 'tipo2'] })
  @IsOptional() @IsEnum(['tipo1', 'tipo2'])
  tipo_diabetes?: 'tipo1' | 'tipo2';

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  artrosis?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  insuficiencia_renal?: boolean;

  @ApiPropertyOptional({ enum: ['leve', 'moderada', 'severa'] })
  @IsOptional() @IsEnum(['leve', 'moderada', 'severa'])
  grado_ir?: 'leve' | 'moderada' | 'severa';

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  osteoporosis?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  hipertension?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  obesidad?: boolean;

  // ── Historia de dolor lumbar ─────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 6 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  tiempo_evolucion_meses?: number;

  @ApiPropertyOptional({ example: 7, minimum: 0, maximum: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10)
  eva_inicial?: number;

  @ApiPropertyOptional({
    enum: ['ninguna', 'glutea', 'ciatica_derecha', 'ciatica_izquierda', 'bilateral'],
  })
  @IsOptional()
  @IsEnum(['ninguna', 'glutea', 'ciatica_derecha', 'ciatica_izquierda', 'bilateral'])
  irradiacion?: string;

  @ApiPropertyOptional({ enum: ['mecanico', 'inflamatorio', 'mixto'] })
  @IsOptional() @IsEnum(['mecanico', 'inflamatorio', 'mixto'])
  tipo_dolor?: 'mecanico' | 'inflamatorio' | 'mixto';

  @ApiPropertyOptional({ example: ['sedestacion', 'esfuerzo'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  factores_agravantes?: string[];

  // ── Signos neurológicos ──────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  parestesias?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  deficit_motor?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  perdida_sensibilidad?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  signo_lasegue?: boolean;

  @ApiPropertyOptional({ enum: ['L1-L2', 'L2-L3', 'L3-L4', 'L4-L5', 'L5-S1', 'multiple'] })
  @IsOptional()
  @IsEnum(['L1-L2', 'L2-L3', 'L3-L4', 'L4-L5', 'L5-S1', 'multiple'])
  nivel_afectado_previo?: string;

  // ── Tratamientos previos ─────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  fisioterapia_previa?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  cirugias_previas_columna?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  infiltraciones_previas?: boolean;

  @ApiPropertyOptional({ example: ['ibuprofeno', 'pregabalina'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  medicacion_actual?: string[];

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observaciones_adicionales?: string;
}
