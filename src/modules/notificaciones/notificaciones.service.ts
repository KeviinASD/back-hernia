// src/notificaciones/notificaciones.service.ts

import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import * as PDFDocument from 'pdfkit';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Diagnostico, Progresion } from '../diagnostico/entities/diagnostico.entity';
import { WhatsappPayloadDto } from './dto/whatsapp-payload.dto';
import { WhatsappPdfPayloadDto } from './dto/whatsapp-pdf-payload.dto';

@Injectable()
export class NotificacionesService {

    private readonly logger = new Logger(NotificacionesService.name);

    private readonly webhookUrl = process.env.N8N_WEBHOOK_URL ?? '';
    private readonly webhookReporte = process.env.VITE_N8N_REPORTE_PDF ?? '';
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

    // ─── Enviar PDF de tratamiento por WhatsApp ───────────────────────────────────
    async enviarPdfWhatsapp(
        paciente: Paciente,
        diagnosticos: Diagnostico[],
        doctor: { nombre: string; apellido: string },
    ): Promise<void> {

        if (!this.webhookReporte) {
            this.logger.warn('N8N_WEBHOOK_URL no configurado — envío de PDF omitido');
            return;
        }

        if (!paciente.telefono) {
            this.logger.warn(
                `Paciente ${paciente.id} no tiene teléfono registrado — PDF WhatsApp omitido`,
            );
            return;
        }

        const pdfBuffer = await this.generarPdfResumenTratamiento(paciente, diagnosticos, doctor);

        const fechaStr = new Date().toISOString().split('T')[0];
        const payload: WhatsappPdfPayloadDto = {
            telefono: this.formatearTelefono(paciente.telefono),
            fileName: `reporte-tratamiento-${fechaStr}.pdf`,
            mimeType: 'application/pdf',
            file: pdfBuffer.toString('base64'),
            generatedAt: new Date().toISOString(),
            size: pdfBuffer.length,
        };

        try {
            this.logger.log(`Enviando PDF por WhatsApp a ${payload.telefono} vía n8n...`);

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (this.webhookSecret) headers['x-webhook-secret'] = this.webhookSecret;

            const response = await axios.post(this.webhookReporte, payload, {
                headers,
                timeout: 30_000, // 30 s — el PDF puede tardar más
            });

            this.logger.log(`PDF enviado correctamente — n8n respondió ${response.status}`);

        } catch (err) {
            if (axios.isAxiosError(err)) {
                const axiosErr = err as AxiosError;
                this.logger.error(
                    `Error enviando PDF a n8n [${axiosErr.response?.status ?? 'timeout'}]: ${axiosErr.message}`,
                );
            } else {
                this.logger.error('Error inesperado enviando PDF por WhatsApp:', err);
            }
        }
    }

    // ─── PDF: resumen de tratamiento ─────────────────────────────────────────────
    async generarPdfResumenTratamiento(
        paciente: Paciente,
        diagnosticos: Diagnostico[],
        doctor: { nombre: string; apellido: string },
    ): Promise<Buffer> {

        // Ordenar de más antiguo a más reciente para gráficas cronológicas
        const ordenados = [...diagnosticos].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        const ultimo = ordenados[ordenados.length - 1];

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const W = 495; // ancho útil (595 - 2*50)
            const AZUL = '#1a5276';
            const GRIS = '#7f8c8d';
            const VERDE = '#1e8449';
            const ROJO = '#c0392b';
            const NARANJA = '#d35400';
            const FONDO_CLARO = '#eaf4fb';

            // ── Encabezado ───────────────────────────────────────────────────────
            doc.rect(50, 40, W, 70).fill(AZUL);
            doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
                .text('REPORTE DE SEGUIMIENTO', 60, 55, { width: W - 20 });
            doc.fontSize(10).font('Helvetica')
                .text('Sistema de Diagnóstico de Hernia Discal', 60, 80, { width: W - 20 });
            doc.text(`Generado: ${new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`, 60, 94, { width: W - 20 });

            doc.moveDown(4);

            // ── Datos del paciente ────────────────────────────────────────────────
            const edadAnos = paciente.fecha_nacimiento
                ? Math.floor((Date.now() - new Date(paciente.fecha_nacimiento).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
                : null;

            doc.fillColor(AZUL).fontSize(13).font('Helvetica-Bold').text('DATOS DEL PACIENTE', 50);
            doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke(AZUL);
            doc.moveDown(0.5);

            const col1X = 50;
            const col2X = 300;
            const startY = doc.y;

            doc.fillColor('#2c3e50').fontSize(10).font('Helvetica-Bold').text('Paciente:', col1X, startY);
            doc.font('Helvetica').text(`${paciente.nombre} ${paciente.apellido}`, col1X + 65, startY);

            doc.font('Helvetica-Bold').text('DNI:', col2X, startY);
            doc.font('Helvetica').text(paciente.dni, col2X + 30, startY);

            doc.font('Helvetica-Bold').text('Edad:', col1X, startY + 16);
            doc.font('Helvetica').text(edadAnos !== null ? `${edadAnos} años` : '—', col1X + 38, startY + 16);

            doc.font('Helvetica-Bold').text('Sexo:', col2X, startY + 16);
            doc.font('Helvetica').text(paciente.sexo === 'M' ? 'Masculino' : 'Femenino', col2X + 34, startY + 16);

            doc.font('Helvetica-Bold').text('Médico:', col1X, startY + 32);
            doc.font('Helvetica').text(`Dr. ${doctor.nombre} ${doctor.apellido}`, col1X + 48, startY + 32);

            if (paciente.imc) {
                doc.font('Helvetica-Bold').text('IMC:', col2X, startY + 32);
                doc.font('Helvetica').text(`${paciente.imc}`, col2X + 28, startY + 32);
            }

            doc.moveDown(4);

            // ── Resumen del último diagnóstico ────────────────────────────────────
            if (ultimo) {
                doc.fillColor(AZUL).fontSize(13).font('Helvetica-Bold').text('DIAGNÓSTICO ACTUAL');
                doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke(AZUL);
                doc.moveDown(0.5);

                const progresionColor = {
                    [Progresion.MEJORA]: VERDE,
                    [Progresion.ESTABLE]: NARANJA,
                    [Progresion.DETERIORO]: ROJO,
                    [Progresion.PRIMERA_CITA]: AZUL,
                }[ultimo.progresion] ?? GRIS;

                // Caja de estado
                const cajaY = doc.y;
                doc.rect(50, cajaY, W, 50).fill(FONDO_CLARO);
                doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(10)
                    .text('Tipo de hernia:', 60, cajaY + 8);
                doc.font('Helvetica').text(ultimo.tipoHernia ?? '—', 150, cajaY + 8);

                doc.font('Helvetica-Bold').text('Nivel vertebral:', 60, cajaY + 24);
                doc.font('Helvetica').text(ultimo.nivelVertebral ?? '—', 150, cajaY + 24);

                doc.font('Helvetica-Bold').text('Progresión:', 310, cajaY + 8);
                doc.fillColor(progresionColor).font('Helvetica-Bold').text(
                    (ultimo.progresion ?? '—').toUpperCase(), 380, cajaY + 8,
                );

                doc.fillColor('#2c3e50').font('Helvetica-Bold').text('Riesgo quirúrgico:', 310, cajaY + 24);
                const riesgoColor = { bajo: VERDE, medio: NARANJA, alto: ROJO }[ultimo.riesgoQuirurgico] ?? GRIS;
                doc.fillColor(riesgoColor).font('Helvetica-Bold')
                    .text((ultimo.riesgoQuirurgico ?? '—').toUpperCase(), 420, cajaY + 24);

                doc.moveDown(4.5);
                doc.x = 50; // resetear cursor al margen izquierdo tras posiciones explícitas de la caja

                // Texto diagnóstico
                if (ultimo.diagnosticoTexto) {
                    doc.fillColor('#2c3e50').fontSize(10).font('Helvetica-Bold')
                        .text('Diagnóstico:', 50, doc.y);
                    doc.font('Helvetica').fillColor('#2c3e50')
                        .text(ultimo.diagnosticoTexto, 50, doc.y, { align: 'justify', width: W });
                    doc.moveDown(0.5);
                }

                // Tratamiento
                if (ultimo.tratamientoTexto) {
                    doc.font('Helvetica-Bold').fillColor('#2c3e50')
                        .text('Plan de tratamiento:', 50, doc.y);
                    doc.font('Helvetica')
                        .text(ultimo.tratamientoTexto, 50, doc.y, { align: 'justify', width: W });
                    doc.moveDown(0.5);
                }

                // Medicación
                if (ultimo.medicacion?.length) {
                    doc.font('Helvetica-Bold').fillColor('#2c3e50')
                        .text('Medicación indicada:', 50, doc.y);
                    ultimo.medicacion.forEach(m => {
                        doc.font('Helvetica').text(`  • ${m}`, 50, doc.y);
                    });
                    doc.moveDown(0.5);
                }

                if (ultimo.semanasSeguimiento) {
                    doc.font('Helvetica-Bold').fillColor('#2c3e50')
                        .text(`Seguimiento: ${ultimo.semanasSeguimiento} semanas`, 50, doc.y);
                }

                doc.moveDown(1);
            }

            // ── Gráficas de tendencia ─────────────────────────────────────────────
            if (ordenados.length > 1) {
                const conScores = ordenados.filter(
                    d => d.scoreSeveridad != null || d.scoreFuncional != null || d.evaDolor != null,
                );

                if (conScores.length >= 2) {
                    // Verificar si hay espacio suficiente; si no, nueva página
                    if (doc.y > 550) doc.addPage();

                    doc.fillColor(AZUL).fontSize(13).font('Helvetica-Bold').text('TENDENCIA DE INDICADORES');
                    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke(AZUL);
                    doc.moveDown(0.8);

                    const graficaConfig = [
                        { label: 'Score Severidad (0-100)', key: 'scoreSeveridad' as keyof Diagnostico, maxVal: 100, color: ROJO },
                        { label: 'Score Funcional (0-100)', key: 'scoreFuncional' as keyof Diagnostico, maxVal: 100, color: VERDE },
                        { label: 'EVA Dolor (0-10)', key: 'evaDolor' as keyof Diagnostico, maxVal: 10, color: NARANJA },
                    ];

                    for (const g of graficaConfig) {
                        const datos = conScores.filter(d => d[g.key] != null);
                        if (datos.length < 1) continue;

                        if (doc.y > 680) doc.addPage();

                        doc.fillColor('#2c3e50').fontSize(10).font('Helvetica-Bold').text(g.label);
                        doc.moveDown(0.3);

                        const BAR_MAX_W = W - 120;
                        const BAR_H = 14;
                        const GAP = 6;

                        datos.forEach(d => {
                            const valor = Number(d[g.key]);
                            const barW = Math.max(2, Math.round((valor / g.maxVal) * BAR_MAX_W));
                            const rowY = doc.y;
                            const fechaStr = new Date(d.createdAt).toLocaleDateString('es-PE', {
                                day: '2-digit', month: '2-digit', year: '2-digit',
                            });

                            // Etiqueta fecha
                            doc.fillColor(GRIS).font('Helvetica').fontSize(8)
                                .text(fechaStr, 50, rowY + 3, { width: 55 });

                            // Barra fondo
                            doc.rect(110, rowY, BAR_MAX_W, BAR_H).fill('#ecf0f1');
                            // Barra valor
                            doc.rect(110, rowY, barW, BAR_H).fill(g.color);
                            // Valor numérico
                            doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(9)
                                .text(String(valor), 110 + barW + 4, rowY + 3);

                            doc.moveDown(0);
                            doc.y = rowY + BAR_H + GAP;
                        });

                        doc.moveDown(1);
                    }
                }
            }

            // ── Historial de citas ────────────────────────────────────────────────
            if (ordenados.length > 0) {
                if (doc.y > 600) doc.addPage();

                doc.fillColor(AZUL).fontSize(13).font('Helvetica-Bold').text('HISTORIAL DE CITAS');
                doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke(AZUL);
                doc.moveDown(0.5);

                // Cabecera de tabla
                const cols = [50, 110, 195, 275, 355, 430];
                const headers = ['Fecha', 'Tipo hernia', 'Nivel', 'Sev.', 'Func.', 'Progresión'];
                const tHeaderY = doc.y;

                doc.rect(50, tHeaderY, W, 16).fill(AZUL);
                headers.forEach((h, i) => {
                    doc.fillColor('white').font('Helvetica-Bold').fontSize(8)
                        .text(h, cols[i] + 2, tHeaderY + 4, { width: (cols[i + 1] ?? 545) - cols[i] - 4 });
                });
                doc.y = tHeaderY + 18;

                // Filas
                ordenados.forEach((d, idx) => {
                    if (doc.y > 760) doc.addPage();

                    const rowY = doc.y;
                    const bg = idx % 2 === 0 ? '#f8f9fa' : 'white';
                    doc.rect(50, rowY, W, 14).fill(bg);

                    const cells = [
                        new Date(d.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' }),
                        d.tipoHernia ?? '—',
                        d.nivelVertebral ?? '—',
                        d.scoreSeveridad != null ? String(d.scoreSeveridad) : '—',
                        d.scoreFuncional != null ? String(d.scoreFuncional) : '—',
                        d.progresion ?? '—',
                    ];

                    cells.forEach((cell, i) => {
                        doc.fillColor('#2c3e50').font('Helvetica').fontSize(8)
                            .text(cell, cols[i] + 2, rowY + 3, { width: (cols[i + 1] ?? 545) - cols[i] - 4 });
                    });

                    doc.y = rowY + 16;
                });

                doc.moveDown(1);
            }

            // ── Pie de página ─────────────────────────────────────────────────────
            const pageCount = (doc as any).bufferedPageRange?.()?.count ?? 1;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fillColor(GRIS).fontSize(8).font('Helvetica')
                    .text(
                        `Documento generado automáticamente — Dr. ${doctor.nombre} ${doctor.apellido}  |  Página ${i + 1}`,
                        50, 820, { align: 'center', width: W },
                    );
            }

            doc.end();
        });
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