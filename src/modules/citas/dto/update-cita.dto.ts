import {
    IsDateString,
    IsEnum,
    IsString,
    IsOptional,
    IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoCita } from '../entities/cita.entity';

export class UpdateCitaDto {
    @ApiPropertyOptional({ example: '2024-07-20T10:00:00.000Z' })
    @IsDateString()
    @IsOptional()
    fechaCita?: string;

    @ApiPropertyOptional({ enum: EstadoCita })
    @IsEnum(EstadoCita)
    @IsOptional()
    estado?: EstadoCita;

    @ApiPropertyOptional({ example: 'Revisión post-infiltración' })
    @IsString()
    @IsOptional()
    motivoConsulta?: string;

    @ApiPropertyOptional({ example: 'uuid-del-doctor' })
    @IsUUID()
    @IsOptional()
    doctorId?: string;
}