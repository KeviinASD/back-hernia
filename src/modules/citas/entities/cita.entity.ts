import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { User } from '../../users/entities/user.entity';
import { Diagnostico } from 'src/modules/diagnostico/entities/diagnostico.entity';
import { ImagenRm } from 'src/modules/imagenes/entities/imagenes.entity';

export enum EstadoCita {
    PROGRAMADA = 'programada',
    EN_CURSO = 'en_curso',
    COMPLETADA = 'completada',
    CANCELADA = 'cancelada',
}

@Entity('citas')
export class Cita {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Paciente, { nullable: false })
    @JoinColumn({ name: 'paciente_id' })
    paciente: Paciente;

    @Column({ name: 'paciente_id' })
    pacienteId: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'doctor_id' })
    doctor: User;

    @Column({ name: 'doctor_id' })
    doctorId: string;

    @Column({ name: 'fecha_cita', type: 'timestamp' })
    fechaCita: Date;

    @Column({
        type: 'varchar',
        length: 20,
        default: EstadoCita.PROGRAMADA,
        enum: EstadoCita,
    })
    estado: EstadoCita;

    @Column({ name: 'motivo_consulta', type: 'text', nullable: true })
    motivoConsulta: string;

    @OneToMany(() => ImagenRm, (imagen) => imagen.cita, { cascade: true })
    imagenes: ImagenRm[];

    /* @OneToOne(() => Diagnostico, (diagnostico) => diagnostico.cita)
    diagnostico: Diagnostico; */

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    // src/citas/entities/cita.entity.ts — AGREGAR esta relación (ya la tienes comentada)

    // Dentro de la clase Cita, descomentar y ajustar:
    @OneToOne(() => Diagnostico, (d) => d.cita)
    diagnostico: Diagnostico;
}