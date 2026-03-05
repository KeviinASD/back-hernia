import {
    IsUUID,
    IsDateString,
    IsString,
    IsOptional,
    IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCitaDto {
    @ApiProperty({ example: 'uuid-del-paciente' })
    @IsUUID()
    @IsNotEmpty()
    pacienteId: string;

    @ApiProperty({ example: '2024-07-20T10:00:00.000Z' })
    @IsDateString()
    @IsNotEmpty()
    fechaCita: string;

    @ApiPropertyOptional({ example: 'Dolor lumbar con irradiación a pierna derecha' })
    @IsString()
    @IsOptional()
    motivoConsulta?: string;
}