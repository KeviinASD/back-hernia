import {
  Entity, PrimaryGeneratedColumn, Column,
  UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';

@Entity('historia_clinica')
export class HistoriaClinica {

  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Paciente, (p) => p.historia_clinica, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  // ── Comorbilidades ───────────────────────────────────────────────────────────
  @Column({ default: false })
  diabetes: boolean;

  @Column({
    type: 'enum',
    enum: ['tipo1', 'tipo2'],
    nullable: true,
  })
  tipo_diabetes: 'tipo1' | 'tipo2' | null;

  @Column({ default: false })
  artrosis: boolean;

  @Column({ default: false })
  insuficiencia_renal: boolean;

  @Column({
    type: 'enum',
    enum: ['leve', 'moderada', 'severa'],
    nullable: true,
  })
  grado_ir: 'leve' | 'moderada' | 'severa' | null;

  @Column({ default: false })
  osteoporosis: boolean;

  @Column({ default: false })
  hipertension: boolean;

  @Column({ default: false })
  obesidad: boolean;

  // ── Historia de dolor lumbar ─────────────────────────────────────────────────
  @Column({ type: 'int', nullable: true })
  tiempo_evolucion_meses: number;

  @Column({ type: 'smallint', nullable: true })
  eva_inicial: number;

  @Column({
    type: 'enum',
    enum: ['ninguna', 'glutea', 'ciatica_derecha', 'ciatica_izquierda', 'bilateral'],
    nullable: true,
  })
  irradiacion: string;

  @Column({
    type: 'enum',
    enum: ['mecanico', 'inflamatorio', 'mixto'],
    nullable: true,
  })
  tipo_dolor: 'mecanico' | 'inflamatorio' | 'mixto' | null;

  @Column({ type: 'text', array: true, nullable: true })
  factores_agravantes: string[];

  // ── Signos neurológicos ──────────────────────────────────────────────────────
  @Column({ default: false })
  parestesias: boolean;

  @Column({ default: false })
  deficit_motor: boolean;

  @Column({ default: false })
  perdida_sensibilidad: boolean;

  @Column({ default: false })
  signo_lasegue: boolean;

  @Column({
    type: 'enum',
    enum: ['L1-L2', 'L2-L3', 'L3-L4', 'L4-L5', 'L5-S1', 'multiple'],
    nullable: true,
  })
  nivel_afectado_previo: string | null;

  // ── Tratamientos previos ─────────────────────────────────────────────────────
  @Column({ default: false })
  fisioterapia_previa: boolean;

  @Column({ default: false })
  cirugias_previas_columna: boolean;

  @Column({ default: false })
  infiltraciones_previas: boolean;

  @Column({ type: 'text', array: true, nullable: true })
  medicacion_actual: string[];

  @Column({ type: 'text', nullable: true })
  observaciones_adicionales: string;

  @UpdateDateColumn()
  updated_at: Date;
}
