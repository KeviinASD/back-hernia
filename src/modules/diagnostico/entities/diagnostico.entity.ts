// src/diagnostico/entities/diagnostico.entity.ts

import {
    Entity, PrimaryGeneratedColumn, Column,
    OneToOne, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Cita } from '../../citas/entities/cita.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';

export enum TipoHernia {
    PROTRUSIÓN = 'protrusión',
    EXTRUSIÓN = 'extrusión',
    SECUESTRO = 'secuestro',
    NO_DETECTADA = 'no_detectada',
}

export enum Progresion {
    MEJORA = 'mejora',
    ESTABLE = 'estable',
    DETERIORO = 'deterioro',
    PRIMERA_CITA = 'primera_cita',
}

export enum RiesgoQuirurgico {
    BAJO = 'bajo',
    MEDIO = 'medio',
    ALTO = 'alto',
}

export enum TratamientoIndicado {
    CONSERVADOR = 'conservador',
    INFILTRACION = 'infiltración',
    QUIRURGICO = 'quirúrgico',
}

@Entity('diagnosticos')
export class Diagnostico {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    // ── Relaciones ────────────────────────────────────────────────────────────────
    @OneToOne(() => Cita, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cita_id' })
    cita: Cita;

    @Column({ name: 'cita_id', unique: true })
    citaId: string;

    @ManyToOne(() => Paciente)
    @JoinColumn({ name: 'paciente_id' })
    paciente: Paciente;

    @Column({ name: 'paciente_id' })
    pacienteId: number;

    // ── Audio y transcripción ─────────────────────────────────────────────────────
    // Audio guardado en BD como bytea (igual que imágenes)
    @Column({ name: 'audio_datos', type: 'bytea', nullable: true })
    audioDatos: Buffer;

    @Column({ name: 'audio_mime_type', length: 50, nullable: true })
    audioMimeType: string;

    @Column({ name: 'transcripcion', type: 'text', nullable: true })
    transcripcion: string;

    // ── Diagnóstico clínico (extraído por Gemini) ─────────────────────────────────
    @Column({ name: 'nivel_vertebral', length: 20, nullable: true })
    nivelVertebral: string;              // 'L4-L5', 'L5-S1', 'multiple'

    @Column({ type: 'enum', enum: TipoHernia, nullable: true })
    tipoHernia: TipoHernia;

    @Column({ name: 'grado_compresion', type: 'smallint', nullable: true })
    gradoCompresion: number;             // 0-3

    // ── Scores para gráficas de tendencia ────────────────────────────────────────
    @Column({ name: 'score_severidad', type: 'smallint', nullable: true })
    scoreSeveridad: number;              // 0-100

    @Column({ name: 'score_funcional', type: 'smallint', nullable: true })
    scoreFuncional: number;              // 0-100

    @Column({ name: 'eva_dolor', type: 'smallint', nullable: true })
    evaDolor: number;                    // 0-10

    // ── Resultados ML (snapshot de PredictAllResponseDto) ────────────────────────
    @Column({ name: 'ml_consensus_hernia', nullable: true })
    mlConsensusHernia: boolean;

    @Column({ name: 'ml_modelos_positivos', type: 'smallint', nullable: true })
    mlModelosPositivos: number;

    @Column({ name: 'ml_total_modelos', type: 'smallint', nullable: true })
    mlTotalModelos: number;

    @Column({ name: 'ml_avg_confidence', type: 'decimal', precision: 5, scale: 4, nullable: true })
    mlAvgConfidence: number;

    @Column({ name: 'ml_detecciones', type: 'jsonb', nullable: true })
    mlDetecciones: object;               // Array completo de DetectionDto[]

    // ── Progresión ────────────────────────────────────────────────────────────────
    @Column({ type: 'enum', enum: Progresion, default: Progresion.PRIMERA_CITA })
    progresion: Progresion;

    @Column({ name: 'velocidad_progresion', length: 10, nullable: true })
    velocidadProgresion: string;         // 'lenta' | 'moderada' | 'rapida'

    // ── Riesgo y tratamiento ──────────────────────────────────────────────────────
    @Column({ name: 'riesgo_quirurgico', type: 'enum', enum: RiesgoQuirurgico, nullable: true })
    riesgoQuirurgico: RiesgoQuirurgico;

    @Column({ name: 'tratamiento_indicado', type: 'enum', enum: TratamientoIndicado, nullable: true })
    tratamientoIndicado: TratamientoIndicado;

    @Column({ type: 'text', array: true, nullable: true })
    medicacion: string[];

    @Column({ name: 'semanas_seguimiento', type: 'smallint', nullable: true })
    semanasSeguimiento: number;

    // ── Textos generados por Gemini ───────────────────────────────────────────────
    @Column({ name: 'diagnostico_texto', type: 'text', nullable: true })
    diagnosticoTexto: string;

    @Column({ name: 'tratamiento_texto', type: 'text', nullable: true })
    tratamientoTexto: string;

    @Column({ name: 'resumen_whatsapp', type: 'text', nullable: true })
    resumenWhatsapp: string;

    // ── Aprobación del doctor ─────────────────────────────────────────────────────
    @Column({ name: 'aprobado_por_doctor', default: false })
    aprobadoPorDoctor: boolean;

    @Column({ name: 'aprobado_at', nullable: true })
    aprobadoAt: Date;

    // ── WhatsApp ──────────────────────────────────────────────────────────────────
    @Column({ name: 'whatsapp_enviado', default: false })
    whatsappEnviado: boolean;

    @Column({ name: 'whatsapp_enviado_at', nullable: true })
    whatsappEnviadoAt: Date;

    @Column({
        name: 'fuente_transcripcion',
        type: 'varchar',
        length: 20,
        default: 'audio',
    })
    fuenteTranscripcion: 'audio' | 'texto_manual';

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

}