// src/notificaciones/dto/whatsapp-pdf-payload.dto.ts

export interface WhatsappPdfPayloadDto {
    telefono: string;      // formato internacional: +51987654321
    fileName: string;      // ej. "reporte-tratamiento-2026-03-05.pdf"
    mimeType: string;      // "application/pdf"
    file: string;          // PDF codificado en base64
    generatedAt: string;   // ISO 8601
    size: number;          // bytes del buffer
}
