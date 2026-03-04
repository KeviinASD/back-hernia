import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriaClinica } from './entities/historia-clinica.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { HistoriaClinicaService } from './historia-clinica.service';
import { HistoriaClinicaController } from './historia-clinica.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HistoriaClinica, Paciente])],
  controllers: [HistoriaClinicaController],
  providers: [HistoriaClinicaService],
  exports: [HistoriaClinicaService],
})
export class HistoriaClinicaModule {}
