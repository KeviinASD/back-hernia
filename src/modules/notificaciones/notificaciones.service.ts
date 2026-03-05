// src/notificaciones/notificaciones.service.ts

import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Diagnostico } from '../diagnostico/entities/diagnostico.entity';
import { WhatsappPayloadDto } from './dto/whatsapp-payload.dto';

@Injectable()
export class NotificacionesService {

    private readonly logger = new Logger(NotificacionesService.name);

    private readonly webhookUrl = process.env.N8N_WEBHOOK_URL ?? '';
    private readonly webhookSecret = process.env.N8N_WEBHOOK_SECRET ?? '';

    // ─── Método principal ────────────────────────────────────────────────────────
    async enviarResumenWhatsapp(
        paciente: Paciente,
        diagnostico: Diagnostico,
        doctor: { nombre: string; apellido: string },
    ): Promise<void> {

        // Validaciones previas — no lanzamos error, solo logueamos y salimos
        if (!this.webhookUrl) {
            this.logger.warn('N8N_WEBHOOK_URL no configurado — notificación omitida');
            return;
        }

        if (!paciente.telefono) {
            this.logger.warn(
                `Paciente ${paciente.id} no tiene teléfono registrado — WhatsApp omitido`,
            );
            return;
        }

        if (!diagnostico.resumenWhatsapp) {
            this.logger.warn(
                `Diagnóstico ${diagnostico.id} no tiene resumen para WhatsApp — omitido`,
            );
            return;
        }

        const payload: WhatsappPayloadDto = {
            citaId: diagnostico.citaId,
            pacienteId: diagnostico.pacienteId,
            telefono: this.formatearTelefono(paciente.telefono),
            nombrePaciente: `${paciente.nombre} ${paciente.apellido}`,
            mensaje: diagnostico.resumenWhatsapp,
            fecha: new Date(diagnostico.createdAt).toLocaleDateString('es-PE', {
                day: '2-digit', month: '2-digit', year: 'numeric',
            }),
            doctor: `Dr. ${doctor.nombre} ${doctor.apellido}`,
            diagnostico: diagnostico.tipoHernia ?? 'no especificado',
            riesgo: diagnostico.riesgoQuirurgico ?? 'no especificado',
            semanasSeguimiento: diagnostico.semanasSeguimiento ?? 4,
        };

        try {
            this.logger.log(`Enviando WhatsApp a ${payload.telefono} vía n8n...`);

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Agregar secret si está configurado
            if (this.webhookSecret) {
                headers['x-webhook-secret'] = this.webhookSecret;
            }

            const response = await axios.post(this.webhookUrl, payload, {
                headers,
                timeout: 10_000,   // 10 segundos máximo
            });

            this.logger.log(
                `WhatsApp enviado correctamente — n8n respondió ${response.status}`,
            );

        } catch (err) {
            // Nunca propagamos el error — el diagnóstico ya fue guardado
            // Solo logueamos para debugging
            if (axios.isAxiosError(err)) {
                const axiosErr = err as AxiosError;
                this.logger.error(
                    `Error llamando a n8n [${axiosErr.response?.status ?? 'timeout'}]: ` +
                    `${axiosErr.message}`,
                );
            } else {
                this.logger.error('Error inesperado enviando WhatsApp:', err);
            }
        }
    }

    // ─── Helper: asegurar formato internacional ──────────────────────────────────
    // Si el número ya tiene +, lo deja igual.
    // Si empieza con 9 (Perú), agrega +51.
    private formatearTelefono(telefono: string): string {
        const limpio = telefono.replace(/\s|-/g, '');
        if (limpio.startsWith('+')) return limpio;
        if (limpio.startsWith('9')) return `+51${limpio}`;
        return limpio;
    }
}