import {
  Controller, Get, Post, Put,
  Param, Body, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HistoriaClinicaService } from './historia-clinica.service';
import { CreateHistoriaClinicaDto } from './dto/create-historia-clinica.dto';
import { UpdateHistoriaClinicaDto } from './dto/update-historia-clinica.dto';

@ApiTags('Historia Clínica')
@ApiBearerAuth()
@Controller('pacientes/:pacienteId/historia-clinica')
export class HistoriaClinicaController {

  constructor(private readonly hcService: HistoriaClinicaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear historia clínica del paciente' })
  create(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Body() dto: CreateHistoriaClinicaDto,
  ) {
    return this.hcService.create(pacienteId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener historia clínica del paciente' })
  findOne(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.hcService.findByPaciente(pacienteId);
  }

  @Put()
  @ApiOperation({ summary: 'Actualizar historia clínica' })
  update(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Body() dto: UpdateHistoriaClinicaDto,
  ) {
    return this.hcService.update(pacienteId, dto);
  }
}
