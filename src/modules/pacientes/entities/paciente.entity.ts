import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToOne,
} from 'typeorm';
import { HistoriaClinica } from '../../historia-clinica/entities/historia-clinica.entity';

@Entity('pacientes')
export class Paciente {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20 })
  dni: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ type: 'date' })
  fecha_nacimiento: Date;

  @Column({ type: 'char', length: 1 })
  sexo: 'M' | 'F';

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: ['sedentaria', 'moderada', 'pesada'],
    nullable: true,
  })
  ocupacion: 'sedentaria' | 'moderada' | 'pesada';

  @Column({ default: false })
  tabaquismo: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  peso_kg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  talla_cm: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  imc: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => HistoriaClinica, (hc) => hc.paciente, { cascade: true })
  historia_clinica: HistoriaClinica;
}
