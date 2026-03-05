// src/diagnostico/dto/aprobar-diagnostico.dto.ts
// Permite al doctor editar y aprobar el diagnóstico generado por IA

import { IsOptional, IsString, IsInt, IsEnum, IsArray, Min, Max } from 'class-validator';
import { TipoHernia, RiesgoQuirurgico, TratamientoIndicado } from '../entities/diagnostico.entity';

export class AprobarDiagnosticoDto {

    @IsOptional() @IsString()
    nivelVertebral?: string;

    @IsOptional() @IsEnum(TipoHernia)
    tipoHernia?: TipoHernia;

    @IsOptional() @IsInt() @Min(0) @Max(3)
    gradoCompresion?: number;

    @IsOptional() @IsInt() @Min(0) @Max(100)
    scoreSeveridad?: number;

    @IsOptional() @IsInt() @Min(0) @Max(10)
    evaDolor?: number;

    @IsOptional() @IsEnum(RiesgoQuirurgico)
    riesgoQuirurgico?: RiesgoQuirurgico;

    @IsOptional() @IsEnum(TratamientoIndicado)
    tratamientoIndicado?: TratamientoIndicado;

    @IsOptional() @IsArray() @IsString({ each: true })
    medicacion?: string[];

    @IsOptional() @IsInt() @Min(1)
    semanasSeguimiento?: number;

    @IsOptional() @IsString()
    diagnosticoTexto?: string;

    @IsOptional() @IsString()
    tratamientoTexto?: string;
}