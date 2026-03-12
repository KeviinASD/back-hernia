// src/imagenes/entities/imagen-rm.entity.ts

import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Cita } from '../../citas/entities/cita.entity';
import { PredictAllResponseDto } from 'src/integrations/detection/dto/predict.dto';

@Entity('imagenes_rm')
export class ImagenRm {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Cita, (cita) => cita.imagenes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cita_id' })
    cita: Cita;

    @Column({ name: 'cita_id' })
    citaId: string;

    // ── Archivo almacenado directamente en BD ────────────────────────────────────
    @Column({ type: 'bytea' })
    datos: Buffer;                          // contenido binario de la imagen

    @Column({ name: 'mime_type', length: 50 })
    mimeType: string;                       // 'image/jpeg' | 'image/png' | 'image/dicom'

    @Column({ name: 'nombre_archivo', length: 255 })
    nombreArchivo: string;

    @Column({ type: 'int', nullable: true })
    tamano_bytes: number;

    // ======================================
    // Procesamiento con los modelos
    // ======================================

    @Column({ name: 'ml_resultado', type: 'jsonb', nullable: true })
    mlResultado: PredictAllResponseDto | null;  // null = aún no procesada

    @Column({ name: 'ml_procesada', default: false })
    mlProcesada: boolean;

    @Column({ name: 'ml_procesada_at', nullable: true })
    mlProcesadaAt: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}