import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, MoreThan } from 'typeorm';
import { Cita, EstadoCita } from './entities/cita.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { CreateCitaDto } from './dto/create-cita.dto';
import { FilterCitaDto } from './dto/filter-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';

@Injectable()
export class CitasService {
    private readonly logger = new Logger(CitasService.name);

    constructor(
        @InjectRepository(Cita)
        private readonly citaRepo: Repository<Cita>,
        @InjectRepository(Paciente)
        private readonly pacienteRepo: Repository<Paciente>,
    ) { }

    // ─── CREAR CITA ───────────────────────────────────────────────────────────

    async create(dto: CreateCitaDto, doctorId: string): Promise<Cita> {
        this.logger.log(`Creando cita: patient=${dto.pacienteId}, date=${dto.fechaCita}, doctor=${doctorId}`);
        const fechaCita = new Date(dto.fechaCita);

        // Validar que la fecha no sea en el pasado
        if (fechaCita < new Date()) {
            throw new BadRequestException(`La fecha de la cita (${fechaCita.toISOString()}) no puede ser en el pasado (Actual: ${new Date().toISOString()}).`);
        }

        // Validar solapamiento: mismo doctor, misma hora ± 30 min
        await this.validarDisponibilidad(doctorId, fechaCita);

        const cita = this.citaRepo.create({
            pacienteId: dto.pacienteId,
            doctorId,
            fechaCita,
            motivoConsulta: dto.motivoConsulta,
            estado: EstadoCita.PROGRAMADA,
        });

        return this.citaRepo.save(cita);
    }

    // ─── LISTAR CITAS CON FILTROS Y PAGINACIÓN ────────────────────────────────

    async findAll(filters: FilterCitaDto): Promise<{ data: Cita[]; total: number; page: number; lastPage: number }> {
        const { page = 1, limit = 20, pacienteId, doctorId, estado, fechaDesde, fechaHasta } = filters;

        const where: FindOptionsWhere<Cita> = {};

        if (pacienteId) where.pacienteId = pacienteId;
        if (doctorId) where.doctorId = doctorId;
        if (estado) where.estado = estado;

        if (fechaDesde && fechaHasta) {
            where.fechaCita = Between(new Date(fechaDesde), new Date(fechaHasta + 'T23:59:59'));
        }

        const [data, total] = await this.citaRepo.findAndCount({
            where,
            relations: ['paciente', 'doctor'],
            order: { fechaCita: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    // ─── OBTENER CITA POR ID ──────────────────────────────────────────────────

    async findOne(id: string): Promise<Cita> {
        const cita = await this.citaRepo.findOne({
            where: { id },
            relations: ['paciente', 'doctor', 'imagenes', 'diagnostico'],
        });

        if (!cita) {
            throw new NotFoundException(`Cita con ID "${id}" no encontrada.`);
        }

        return cita;
    }

    // ─── CITAS DE UN PACIENTE ─────────────────────────────────────────────────

    async findByPaciente(pacienteId: number): Promise<Cita[]> {
        return this.citaRepo.find({
            where: { pacienteId },
            relations: ['doctor', 'diagnostico'],
            order: { fechaCita: 'DESC' },
        });
    }

    // ─── CITAS DEL DÍA PARA UN DOCTOR ────────────────────────────────────────

    async findCitasHoy(doctorId: string): Promise<Cita[]> {
        const hoy = new Date();
        const inicio = new Date(hoy.setHours(0, 0, 0, 0));
        const fin = new Date(hoy.setHours(23, 59, 59, 999));

        return this.citaRepo.find({
            where: {
                doctorId,
                fechaCita: Between(inicio, fin),
            },
            relations: ['paciente'],
            order: { fechaCita: 'ASC' },
        });
    }

    // ─── PRÓXIMAS CITAS PARA UN DOCTOR (si hoy está vacío) ───────────────────

    async findProximas(doctorId: string, limit = 10): Promise<Cita[]> {
        const ahora = new Date();

        return this.citaRepo.find({
            where: {
                doctorId,
                fechaCita: MoreThan(ahora),
            },
            relations: ['paciente'],
            order: { fechaCita: 'ASC' },
            take: limit,
        });
    }

    // ─── ACTUALIZAR CITA ──────────────────────────────────────────────────────

    async update(id: string, dto: UpdateCitaDto, doctorId: string): Promise<Cita> {
        const cita = await this.findOne(id);

        // No se puede editar una cita completada o cancelada
        if ([EstadoCita.COMPLETADA, EstadoCita.CANCELADA].includes(cita.estado)) {
            throw new BadRequestException(
                `No se puede modificar una cita en estado "${cita.estado}".`,
            );
        }

        // Si cambia la fecha, revalidar disponibilidad
        if (dto.fechaCita) {
            const nuevaFecha = new Date(dto.fechaCita);
            await this.validarDisponibilidad(doctorId, nuevaFecha, id);
            cita.fechaCita = nuevaFecha;
        }

        if (dto.estado) cita.estado = dto.estado;
        if (dto.motivoConsulta !== undefined) cita.motivoConsulta = dto.motivoConsulta;
        if (dto.doctorId) cita.doctorId = dto.doctorId;

        return this.citaRepo.save(cita);
    }

    // ─── CAMBIAR ESTADO ───────────────────────────────────────────────────────

    async cambiarEstado(id: string, nuevoEstado: EstadoCita): Promise<Cita> {
        const cita = await this.findOne(id);

        const transicionesValidas: Record<EstadoCita, EstadoCita[]> = {
            [EstadoCita.PROGRAMADA]: [EstadoCita.EN_CURSO, EstadoCita.CANCELADA],
            [EstadoCita.EN_CURSO]: [EstadoCita.COMPLETADA, EstadoCita.CANCELADA],
            [EstadoCita.COMPLETADA]: [],
            [EstadoCita.CANCELADA]: [EstadoCita.PROGRAMADA], // reprogramar
        };

        if (!transicionesValidas[cita.estado].includes(nuevoEstado)) {
            throw new BadRequestException(
                `Transición inválida: "${cita.estado}" → "${nuevoEstado}".`,
            );
        }

        cita.estado = nuevoEstado;
        return this.citaRepo.save(cita);
    }

    // ─── CANCELAR CITA ────────────────────────────────────────────────────────

    async cancelar(id: string): Promise<Cita> {
        return this.cambiarEstado(id, EstadoCita.CANCELADA);
    }

    // ─── INICIAR CITA (pasar a EN_CURSO) ─────────────────────────────────────

    async iniciar(id: string): Promise<Cita> {
        return this.cambiarEstado(id, EstadoCita.EN_CURSO);
    }

    // ─── COMPLETAR CITA ───────────────────────────────────────────────────────

    async completar(id: string): Promise<Cita> {
        const cita = await this.findOne(id);

        // Debe tener diagnóstico antes de completar
        /* if (!cita.diagnostico) {
            throw new BadRequestException(
                'La cita no puede completarse sin un diagnóstico generado.',
            );
        } */

        return this.cambiarEstado(id, EstadoCita.COMPLETADA);
    }

    // ─── ESTADÍSTICAS RÁPIDAS ─────────────────────────────────────────────────

    async getStats(doctorId?: string): Promise<Record<string, number>> {
        const qb = this.citaRepo.createQueryBuilder('c');

        if (doctorId) qb.where('c.doctor_id = :doctorId', { doctorId });

        const stats = await qb
            .select('c.estado', 'estado')
            .addSelect('COUNT(*)', 'total')
            .groupBy('c.estado')
            .getRawMany();

        return stats.reduce((acc, row) => {
            acc[row.estado] = parseInt(row.total);
            return acc;
        }, {} as Record<string, number>);
    }

    /** Cantidad de citas del día (opcionalmente por doctor). Si doctorId es undefined, cuenta todas. */
    async getCitasHoyCount(doctorId?: string): Promise<number> {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0, 0);
        const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

        const qb = this.citaRepo
            .createQueryBuilder('c')
            .where('c.fecha_cita BETWEEN :inicio AND :fin', { inicio, fin });

        if (doctorId) qb.andWhere('c.doctor_id = :doctorId', { doctorId });

        return qb.getCount();
    }

    /** Citas agrupadas por mes (últimos N meses). El total del período coincide con el total real (sin filtro por doctor). */
    async getCitasPorMes(doctorId?: string, meses = 6): Promise<{ mes: string; total: number }[]> {
        const qb = this.citaRepo
            .createQueryBuilder('c')
            .select("TO_CHAR(c.fecha_cita, 'YYYY-MM')", 'mes')
            .addSelect('COUNT(*)', 'total')
            .groupBy("TO_CHAR(c.fecha_cita, 'YYYY-MM')")
            .orderBy('mes', 'ASC');

        if (doctorId) qb.where('c.doctor_id = :doctorId', { doctorId });

        const raw = await qb.getRawMany();

        const normalizeMes = (m: unknown) => String(m ?? '').trim();
        const normalizeTotal = (t: unknown) => (typeof t === 'number' ? t : parseInt(String(t ?? 0), 10) || 0);

        const mapRaw = new Map<string, number>();
        raw.forEach((r) => {
            const mes = normalizeMes(r.mes);
            if (mes) mapRaw.set(mes, normalizeTotal(r.total));
        });

        const countQb = this.citaRepo.createQueryBuilder('c');
        if (doctorId) countQb.where('c.doctor_id = :doctorId', { doctorId });
        const totalCitas = await countQb.getCount();

        const now = new Date();
        const result: { mes: string; total: number }[] = [];
        for (let i = 0; i < meses; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - (meses - 1 - i), 1);
            const mesStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            result.push({ mes: mesStr, total: mapRaw.get(mesStr) ?? 0 });
        }

        const sumEnRango = result.reduce((s, r) => s + r.total, 0);
        if (totalCitas > sumEnRango && result.length > 0) {
            const ultimoMes = result[result.length - 1];
            ultimoMes.total += totalCitas - sumEnRango;
        }
        return result;
    }

    // ─── HELPER: VALIDAR DISPONIBILIDAD ──────────────────────────────────────

    private async validarDisponibilidad(
        doctorId: string,
        fecha: Date,
        excludeId?: string,
    ): Promise<void> {
        const margen = 30 * 60 * 1000; // 30 minutos en ms
        const desde = new Date(fecha.getTime() - margen);
        const hasta = new Date(fecha.getTime() + margen);

        const qb = this.citaRepo
            .createQueryBuilder('c')
            .where('c.doctor_id = :doctorId', { doctorId })
            .andWhere('c.fecha_cita BETWEEN :desde AND :hasta', { desde, hasta })
            .andWhere('c.estado NOT IN (:...estados)', {
                estados: [EstadoCita.CANCELADA],
            });

        if (excludeId) {
            qb.andWhere('c.id != :excludeId', { excludeId });
        }

        const conflicto = await qb.getOne();

        if (conflicto) {
            throw new ConflictException(
                `El doctor ya tiene una cita programada cerca de esa hora (${conflicto.fechaCita.toISOString()}).`,
            );
        }
    }

}