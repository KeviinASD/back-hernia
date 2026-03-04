import {
  IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional,
  IsBoolean, IsNumber, IsEmail, Length, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePacienteDto {

  @ApiProperty({ example: '45678901' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  dni: string;

  @ApiProperty({ example: 'Carlos' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  nombre: string;

  @ApiProperty({ example: 'Ramírez' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  apellido: string;

  @ApiProperty({ example: '1980-05-15' })
  @IsDateString()
  fecha_nacimiento: string;

  @ApiProperty({ enum: ['M', 'F'] })
  @IsEnum(['M', 'F'])
  sexo: 'M' | 'F';

  @ApiPropertyOptional({ example: '+51987654321' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'carlos@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: ['sedentaria', 'moderada', 'pesada'] })
  @IsOptional()
  @IsEnum(['sedentaria', 'moderada', 'pesada'])
  ocupacion?: 'sedentaria' | 'moderada' | 'pesada';

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  tabaquismo?: boolean;

  @ApiPropertyOptional({ example: 75.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(300)
  peso_kg?: number;

  @ApiPropertyOptional({ example: 170.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(50)
  @Max(250)
  talla_cm?: number;
}
