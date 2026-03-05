import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { CitasModule } from '../citas/cita.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Paciente]), CitasModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
