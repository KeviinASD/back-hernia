import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoriaClinica } from './entities/historia-clinica.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { CreateHistoriaClinicaDto } from './dto/create-historia-clinica.dto';
import { UpdateHistoriaClinicaDto } from './dto/update-historia-clinica.dto';

@Injectable()
export class HistoriaClinicaService {

  constructor(
    @InjectRepository(HistoriaClinica)
    private readonly hcRepo: Repository<HistoriaClinica>,

    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
  ) {}

  async create(pacienteId: number, dto: CreateHistoriaClinicaDto): Promise<HistoriaClinica> {
    const paciente = await this.pacienteRepo.findOne({ where: { id: pacienteId } });
    if (!paciente) throw new NotFoundException(`Paciente ${pacienteId} no encontrado`);

    const existente = await this.hcRepo.findOne({ where: { paciente: { id: pacienteId } } });
    if (existente) throw new ConflictException('Este paciente ya tiene una historia clínica');

    const hc = this.hcRepo.create({ ...dto, paciente });
    return this.hcRepo.save(hc);
  }

  async findByPaciente(pacienteId: number): Promise<HistoriaClinica> {
    const hc = await this.hcRepo.findOne({
      where: { paciente: { id: pacienteId } },
      relations: ['paciente'],
    });
    if (!hc) throw new NotFoundException(`Historia clínica no encontrada para paciente ${pacienteId}`);
    return hc;
  }

  async update(pacienteId: number, dto: UpdateHistoriaClinicaDto): Promise<HistoriaClinica> {
    const hc = await this.findByPaciente(pacienteId);
    Object.assign(hc, dto);
    return this.hcRepo.save(hc);
  }

  async getContextoParaIA(pacienteId: number): Promise<object> {
    const hc = await this.findByPaciente(pacienteId);
    const p  = hc.paciente;

    return {
      edad:      this.calcularEdad(p.fecha_nacimiento),
      sexo:      p.sexo,
      imc:       p.imc,
      ocupacion: p.ocupacion,
      tabaquismo: p.tabaquismo,

      comorbilidades: {
        diabetes:            hc.diabetes,
        tipo_diabetes:       hc.tipo_diabetes,
        artrosis:            hc.artrosis,
        insuficiencia_renal: hc.insuficiencia_renal,
        grado_ir:            hc.grado_ir,
        osteoporosis:        hc.osteoporosis,
        hipertension:        hc.hipertension,
        obesidad:            hc.obesidad,
      },

      dolor_lumbar: {
        tiempo_evolucion_meses: hc.tiempo_evolucion_meses,
        eva_inicial:            hc.eva_inicial,
        tipo_dolor:             hc.tipo_dolor,
        irradiacion:            hc.irradiacion,
        factores_agravantes:    hc.factores_agravantes,
      },

      signos_neurologicos: {
        parestesias:          hc.parestesias,
        deficit_motor:        hc.deficit_motor,
        perdida_sensibilidad: hc.perdida_sensibilidad,
        signo_lasegue:        hc.signo_lasegue,
        nivel_afectado_previo: hc.nivel_afectado_previo,
      },

      antecedentes: {
        fisioterapia_previa:      hc.fisioterapia_previa,
        cirugias_previas_columna: hc.cirugias_previas_columna,
        infiltraciones_previas:   hc.infiltraciones_previas,
        medicacion_actual:        hc.medicacion_actual,
      },
    };
  }

  private calcularEdad(fechaNacimiento: Date): number {
    const hoy   = new Date();
    const nacim = new Date(fechaNacimiento);
    let edad    = hoy.getFullYear() - nacim.getFullYear();
    const mes   = hoy.getMonth() - nacim.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacim.getDate())) edad--;
    return edad;
  }
}
