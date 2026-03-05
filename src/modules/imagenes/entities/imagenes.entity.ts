import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { Cita } from '../../citas/entities/cita.entity';

@Entity('imagenes_rm')
export class ImagenRm {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Cita, (cita) => cita.imagenes, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cita_id' })
    cita: Cita;

    @Column({ name: 'cita_id' })
    citaId: number;

    @Column({ name: 'archivo_path', type: 'text' })
    archivoPath: string;           // ruta local o clave S3

    @Column({ name: 'archivo_nombre', length: 255, nullable: true })
    archivoNombre: string;

    @Column({ name: 'mime_type', length: 50, nullable: true })
    mimeType: string;

    @Column({ name: 'size_bytes', type: 'int', nullable: true })
    sizeBytes: number;

    @Column({ name: 'es_principal', default: false })
    esPrincipal: boolean;          // la imagen que se envía a Gemini Vision

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}