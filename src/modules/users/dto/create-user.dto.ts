import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleTier } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'dr.sanchez' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'doctor@hospital.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePass123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: RoleTier, default: RoleTier.User })
  @IsOptional()
  @IsEnum(RoleTier)
  roleTier?: RoleTier;
}
