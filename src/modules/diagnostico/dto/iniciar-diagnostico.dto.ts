// src/diagnostico/dto/iniciar-diagnostico.dto.ts

import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IniciarDiagnosticoDto {

    @ApiProperty({
        description: 'Nombre del modelo YOLO seleccionado por el usuario (el de mayor confianza)',
        example: 'yolo-hernia-v2',
    })
    @IsString()
    @IsNotEmpty()
    modeloSeleccionado: string;

    @ApiPropertyOptional({
        description: 'Texto del dictado médico (alternativa al audio para pruebas)',
        example: 'Paciente presenta protrusión discal en L4-L5 con compresión radicular moderada...',
    })
    @IsOptional()
    @IsString()
    @MinLength(10)
    textoManual?: string;

    // El audio viene como archivo multipart — no es un campo del DTO
    // Se inyecta desde el controller como @UploadedFile()
}