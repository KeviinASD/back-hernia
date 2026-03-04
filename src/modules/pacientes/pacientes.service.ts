import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Injectable()
export class PacientesService {

  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
  ) {}

  async create(dto: CreatePacienteDto): Promise<Paciente> {
    const existe = await this.pacienteRepo.findOne({ where: { dni: dto.dni } });
    if (existe) throw new ConflictException(`Ya existe un paciente con DNI ${dto.dni}`);

    const paciente = this.pacienteRepo.create({
      ...dto,
      imc: this.calcularIMC(dto.peso_kg, dto.talla_cm),
    });

    return this.pacienteRepo.save(paciente);
  }

  async findAll(): Promise<Paciente[]> {
    return this.pacienteRepo.find({
      where: { activo: true },
      relations: ['historia_clinica'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Paciente> {
    const paciente = await this.pacienteRepo.findOne({
      where: { id },
      relations: ['historia_clinica'],
    });
    if (!paciente) throw new NotFoundException(`Paciente ${id} no encontrado`);
    return paciente;
  }

  async findByDni(dni: string): Promise<Paciente> {
    const paciente = await this.pacienteRepo.findOne({
      where: { dni },
      relations: ['historia_clinica'],
    });
    if (!paciente) throw new NotFoundException(`Paciente con DNI ${dni} no encontrado`);
    return paciente;
  }

  async update(id: number, dto: UpdatePacienteDto): Promise<Paciente> {
    const paciente = await this.findOne(id);

    const pesoFinal  = dto.peso_kg  ?? paciente.peso_kg;
    const tallaFinal = dto.talla_cm ?? paciente.talla_cm;

    Object.assign(paciente, dto, {
      imc: this.calcularIMC(pesoFinal, tallaFinal),
    });

    return this.pacienteRepo.save(paciente);
  }

  async remove(id: number): Promise<void> {
    const paciente = await this.findOne(id);
    paciente.activo = false;
    await this.pacienteRepo.save(paciente);
  }

  private calcularIMC(peso?: number, talla?: number): number | null {
    if (!peso || !talla) return null;
    const tallaMts = talla / 100;
    return parseFloat((peso / (tallaMts * tallaMts)).toFixed(2));
  }
}
