// src/notificaciones/dto/whatsapp-payload.dto.ts

export interface WhatsappPayloadDto {
    // Identificación
    citaId: string;
    pacienteId: number;

    // Destino del mensaje
    telefono: string;       // formato internacional: +51987654321
    nombrePaciente: string;

    // Contenido del mensaje
    mensaje: string;       // resumen_whatsapp generado por Gemini

    // Datos clínicos extra por si el workflow de n8n los necesita
    // para formatear el mensaje o para logs
    fecha: string;       // fecha de la cita formateada
    doctor: string;       // nombre del doctor
    diagnostico: string;       // tipo de hernia detectada
    riesgo: string;       // riesgo quirúrgico
    semanasSeguimiento: number; // cuándo volver
}