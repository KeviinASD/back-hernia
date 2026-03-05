import {
    IsUUID,
    IsDateString,
    IsString,
    IsOptional,
    IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCitaDto {
    @ApiProperty({ example: 1 })
    @Transform(({ value }) => Number(value))
    @IsNotEmpty()
    pacienteId: number;

    @ApiProperty({ example: '2024-07-20T10:00:00.000Z' })
    @IsDateString()
    @IsNotEmpty()
    fechaCita: string;

    @ApiPropertyOptional({ example: 'Dolor lumbar con irradiación a pierna derecha' })
    @IsString()
    @IsOptional()
    motivoConsulta?: string;
}