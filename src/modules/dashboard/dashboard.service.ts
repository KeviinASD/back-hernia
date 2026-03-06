import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { CitasService } from '../citas/cita.service';

export interface DashboardStatsDto {
  totalPacientes: number;
  citasStats: Record<string, number>;
  citasHoy: number;
  citasPorMes: { mes: string; total: number }[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    private readonly citasService: CitasService,
  ) {}

  async getStats(doctorId?: string): Promise<DashboardStatsDto> {
    const [totalPacientes, citasStats, citasHoy, citasPorMes] = await Promise.all([
      this.pacienteRepo.count({ where: { activo: true } }),
      this.citasService.getStats(doctorId),
      this.citasService.getCitasHoyCount(doctorId),
      this.citasService.getCitasPorMes(doctorId, 4),
    ]);

    return {
      totalPacientes,
      citasStats: {
        programada: citasStats.programada ?? 0,
        en_curso: citasStats.en_curso ?? 0,
        completada: citasStats.completada ?? 0,
        cancelada: citasStats.cancelada ?? 0,
      },
      citasHoy,
      citasPorMes,
    };
  }
}
