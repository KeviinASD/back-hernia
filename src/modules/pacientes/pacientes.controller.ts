import {
  Controller, Get, Post, Put, Delete,
  Param, Body, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@ApiTags('Pacientes')
@ApiBearerAuth()
@Controller('pacientes')
export class PacientesController {

  constructor(private readonly pacientesService: PacientesService) { }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo paciente' })
  create(@Body() dto: CreatePacienteDto) {
    return this.pacientesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los pacientes activos' })
  findAll() {
    return this.pacientesService.findAll();
  }

  @Get('dni/:dni')
  @ApiOperation({ summary: 'Buscar paciente por DNI' })
  findByDni(@Param('dni') dni: string) {
    return this.pacientesService.findByDni(dni);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener paciente por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pacientesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar datos del paciente' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePacienteDto,
  ) {
    return this.pacientesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar paciente (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pacientesService.remove(id);
  }
}
