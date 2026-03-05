import { IsNumber, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UploadImagenDto {
    @ApiProperty({ example: 1, description: 'ID de la cita a la que pertenecen las imágenes' })
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @IsNotEmpty()
    citaId: number;

    @ApiPropertyOptional({ example: true, description: 'Marcar la primera imagen como principal' })
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @IsOptional()
    marcarPrincipal?: boolean = true;
}