// src/diagnostico/dto/diagnostico-response.dto.ts

export class DiagnosticoResponseDto {
    id: string;
    citaId: string;
    pacienteId: string;

    // Transcripción
    transcripcion: string;

    // Clínico
    nivelVertebral: string;
    tipoHernia: string;
    gradoCompresion: number;

    // Scores
    scoreSeveridad: number;
    scoreFuncional: number;
    evaDolor: number;

    // ML
    mlConsensusHernia: boolean;
    mlModelosPositivos: number;
    mlAvgConfidence: number;

    // Progresión
    progresion: string;
    velocidadProgresion: string;

    // Tratamiento
    riesgoQuirurgico: string;
    tratamientoIndicado: string;
    medicacion: string[];
    semanasSeguimiento: number;

    // Textos
    diagnosticoTexto: string;
    tratamientoTexto: string;

    // Estado
    aprobadoPorDoctor: boolean;
    whatsappEnviado: boolean;
    createdAt: Date;
}