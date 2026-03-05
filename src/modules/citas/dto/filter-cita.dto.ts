import {
    IsUUID,
    IsEnum,
    IsOptional,
    IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoCita } from '../entities/cita.entity';
import { Transform } from 'class-transformer';

export class FilterCitaDto {
    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    pacienteId?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    doctorId?: string;

    @ApiPropertyOptional({ enum: EstadoCita })
    @IsEnum(EstadoCita)
    @IsOptional()
    estado?: EstadoCita;

    @ApiPropertyOptional({ example: '2024-07-01' })
    @IsDateString()
    @IsOptional()
    fechaDesde?: string;

    @ApiPropertyOptional({ example: '2024-07-31' })
    @IsDateString()
    @IsOptional()
    fechaHasta?: string;

    @ApiPropertyOptional({ default: 1 })
    @Transform(({ value }) => parseInt(value))
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ default: 20 })
    @Transform(({ value }) => parseInt(value))
    @IsOptional()
    limit?: number = 20;
}