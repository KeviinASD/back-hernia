// src/diagnostico/diagnostico.service.ts

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Diagnostico, Progresion } from './entities/diagnostico.entity';
import { AprobarDiagnosticoDto } from './dto/aprobar-diagnostico.dto';
import { buildDiagnosticoPrompt } from './prompt-builder';

import { ImagenesService } from '../imagenes/imagenes.service';
import { HistoriaClinicaService } from '../historia-clinica/historia-clinica.service';
import { CitasService } from '../citas/cita.service';
import { DetectionService } from 'src/integrations/detection/detection.service';
import { GeminiProvider } from 'src/integrations/ai/providers/gemini.provider';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class DiagnosticoService {

    private readonly logger = new Logger(DiagnosticoService.name);

    constructor(
        @InjectRepository(Diagnostico)
        private readonly diagnosticoRepo: Repository<Diagnostico>,

        private readonly citasService: CitasService,
        private readonly imagenesService: ImagenesService,
        private readonly hcService: HistoriaClinicaService,
        private readonly detectionService: DetectionService,
        private readonly gemini: GeminiProvider,
        private readonly notificaciones: NotificacionesService,
    ) { }

    // ─────────────────────────────────────────────────────────────────────────────
    // MÉTODO PRINCIPAL: procesar la cita completa y generar el diagnóstico
    // ─────────────────────────────────────────────────────────────────────────────
    // src/diagnostico/diagnostico.service.ts
    // Solo se muestra el método procesarCita completo — el resto del servicio no cambia

    async procesarCita(
        citaId: string,
        modeloSeleccionado: string,
        audioFile?: Express.Multer.File,
        textoManual?: string,
    ): Promise<Diagnostico> {

        // ── Guardia: debe venir audio O texto, no ninguno de los dos ──────────────
        if (!audioFile && !textoManual?.trim()) {
            throw new BadRequestException(
                'Debes proporcionar un archivo de audio o un texto manual del dictado médico',
            );
        }

        // ── 1. Verificar que no exista diagnóstico previo ─────────────────────────
        const existe = await this.diagnosticoRepo.findOne({ where: { citaId } });
        if (existe)
            throw new BadRequestException(`La cita ${citaId} ya tiene un diagnóstico generado`);

        // ── 2. Cargar cita con paciente ───────────────────────────────────────────
        const cita = await this.citasService.findOne(citaId);

        // ── 3. Cargar historia clínica ────────────────────────────────────────────
        const hc = await this.hcService.findByPaciente(cita.pacienteId);

        // ── 4. Obtener imágenes ───────────────────────────────────────────────────
        const imagenes = await this.imagenesService.findByCita(citaId);
        if (!imagenes.length)
            throw new BadRequestException('La cita no tiene imágenes RM subidas');

        // ── 5. Correr YOLO con el modelo seleccionado por el usuario ─────────────
        this.logger.log(`Corriendo YOLO con modelo "${modeloSeleccionado}"...`);
        const resultadosML = await this.detectionService.predict(
            {
                buffer: imagenes[0].datos,
                mimetype: imagenes[0].mimeType,
                originalname: imagenes[0].nombreArchivo,
                size: imagenes[0].tamano_bytes,
                fieldname: 'image',
                encoding: '7bit',
                stream: null,
                destination: '',
                filename: '',
                path: '',
            } as Express.Multer.File,
            modeloSeleccionado,
            0.25,
            0.45,
        );

        await Promise.all(imagenes.map(img => this.imagenesService.marcarProcesada(img.id)));

        // ── 6. TRANSCRIPCIÓN — audio o texto ──────────────────────────────────────
        let transcripcion: string;
        let fuenteTranscripcion: 'audio' | 'texto_manual';

        if (audioFile) {
            this.logger.log('Transcribiendo audio con Gemini...');
            transcripcion = await this.gemini.transcribeAudio({
                buffer: audioFile.buffer,
                mimeType: audioFile.mimetype,
                originalname: audioFile.originalname,
            });
            /* transcripcion = "La evolución es muy satisfactoria. La paciente me refiere EVA de 1 sobre 10, prácticamente sin dolor en reposo, puede realizar sus actividades laborales con normalidad. No hay irradiación a extremidades. Exploración neurológica normal. Considerando la mejoría clínica significativa descarto manejo quirúrgico. Indico suspender ciclobenzaprina, mantener ibuprofeno solo si necesario. Continuar ejercicios de estabilización y ergonomía postural. Alta provisional con control en 8 semanas o antes si hay recurrencia."; fuenteTranscripcion = 'audio'; */
        } else {
            this.logger.log('Usando texto manual como transcripción (modo pruebas)');
            transcripcion = textoManual.trim();
            fuenteTranscripcion = 'texto_manual';
        }

        console.log("Transcripción obtenida: ", transcripcion);

        // ── 7. Diagnósticos anteriores ────────────────────────────────────────────
        const diagnosticosAnteriores = await this.diagnosticoRepo.find({
            where: { pacienteId: cita.pacienteId },
            order: { createdAt: 'DESC' },
            take: 3,
        });

        // ── 8. Prompt + Gemini Vision ─────────────────────────────────────────────
        const prompt = buildDiagnosticoPrompt({
            transcripcion,
            paciente: cita.paciente,
            historiaClinica: hc,
            resultadosML,
            diagnosticosAnteriores,
        });

        this.logger.log('Llamando a Gemini Vision...');
        const imagenPrincipal = imagenes[0];
        const respuestaRaw = await this.gemini.callWithImage(
            'Eres un asistente médico especialista en columna lumbar. Responde SOLO con JSON válido.',
            prompt,
            { buffer: imagenPrincipal.datos, mimeType: imagenPrincipal.mimeType },
        );

        // ── 9. Parsear respuesta ──────────────────────────────────────────────────
        const datos = this.parsearRespuestaGemini(respuestaRaw);

        // ── 9.5. Normalizar valores enum (Gemini puede devolver sin tildes, etc) ──
        const datosNormalizados = this.normalizarDatos(datos);

        // ── 10. Guardar en BD ─────────────────────────────────────────────────────
        const diagnostico = this.diagnosticoRepo.create({
            citaId,
            pacienteId: cita.pacienteId,

            // Audio — solo si vino archivo
            audioDatos: audioFile?.buffer ?? null,
            audioMimeType: audioFile?.mimetype ?? null,

            // Transcripción y su fuente
            transcripcion,
            fuenteTranscripcion,

            // ML (PredictResponseDto — modelo único seleccionado)
            mlConsensusHernia: resultadosML.hernia_detected,
            mlModelosPositivos: resultadosML.n_hernias,
            mlTotalModelos: resultadosML.n_total,
            mlAvgConfidence: resultadosML.avg_confidence,
            mlDetecciones: resultadosML.detections,

            // Gemini
            nivelVertebral: datosNormalizados.nivel_vertebral,
            tipoHernia: datosNormalizados.tipo_hernia,
            gradoCompresion: datosNormalizados.grado_compresion,
            scoreSeveridad: datosNormalizados.score_severidad,
            scoreFuncional: datosNormalizados.score_funcional,
            evaDolor: datosNormalizados.eva_dolor,
            progresion: datosNormalizados.progresion ?? Progresion.PRIMERA_CITA,
            velocidadProgresion: datosNormalizados.velocidad_progresion,
            riesgoQuirurgico: datosNormalizados.riesgo_quirurgico,
            tratamientoIndicado: datosNormalizados.tratamiento_indicado,
            medicacion: datosNormalizados.medicacion,
            semanasSeguimiento: datosNormalizados.semanas_seguimiento,
            diagnosticoTexto: datosNormalizados.diagnostico_texto,
            tratamientoTexto: datosNormalizados.tratamiento_texto,
            resumenWhatsapp: datosNormalizados.resumen_whatsapp,
        });

        const guardado = await this.diagnosticoRepo.save(diagnostico);

        // ── 11. WhatsApp (no bloqueante) ──────────────────────────────────────────────
        this.notificaciones
            .enviarResumenWhatsapp(
                cita.paciente,
                guardado,
                { nombre: cita.doctor.username, apellido: cita.doctor.email.split('@')[0] },
            )
            .catch(err => this.logger.error('Error enviando WhatsApp:', err));

        return guardado;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // APROBAR DIAGNÓSTICO (el doctor revisa y valida)
    // ─────────────────────────────────────────────────────────────────────────────
    async aprobar(citaId: string, dto: AprobarDiagnosticoDto): Promise<Diagnostico> {
        const diagnostico = await this.findByCita(citaId);

        Object.assign(diagnostico, dto, {
            aprobadoPorDoctor: true,
            aprobadoAt: new Date(),
        });

        return this.diagnosticoRepo.save(diagnostico);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // OBTENER DIAGNÓSTICO POR CITA
    // ─────────────────────────────────────────────────────────────────────────────
    async findByCita(citaId: string): Promise<Diagnostico> {
        const d = await this.diagnosticoRepo.findOne({ where: { citaId } });
        if (!d) throw new NotFoundException(`No hay diagnóstico para la cita ${citaId}`);
        return d;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // DATOS PARA GRÁFICAS DE TENDENCIA
    // ─────────────────────────────────────────────────────────────────────────────
    async getTendencia(pacienteId: string): Promise<object[]> {
        return this.diagnosticoRepo
            .createQueryBuilder('d')
            .select([
                'd.createdAt         AS fecha',
                'd.scoreSeveridad    AS score_severidad',
                'd.scoreFuncional    AS score_funcional',
                'd.evaDolor          AS eva_dolor',
                'd.gradoCompresion   AS grado_compresion',
                'd.riesgoQuirurgico  AS riesgo_quirurgico',
                'd.tipoHernia        AS tipo_hernia',
                'd.progresion        AS progresion',
                'd.mlConsensusHernia AS ml_consensus',
                'd.mlAvgConfidence   AS ml_confianza',
                'd.nivelVertebral    AS nivel_vertebral',
            ])
            .where('d.pacienteId = :pacienteId', { pacienteId })
            .andWhere('d.aprobadoPorDoctor = true')   // solo diagnósticos validados
            .orderBy('d.createdAt', 'ASC')
            .getRawMany();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // HELPERS PRIVADOS
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Normaliza los valores de enum que Gemini devuelve
     * (puede devolver sin tildes, con espacios, etc)
     */
    private normalizarDatos(datos: Record<string, any>): Record<string, any> {
        const normalizado = { ...datos };

        // Normalizar tipo_hernia: "extrusion" → "extrusión"
        if (normalizado.tipo_hernia) {
            const tipoMap: Record<string, string> = {
                'protrusión': 'protrusión',
                'protusion': 'protrusión',
                'extrusión': 'extrusión',
                'extrusion': 'extrusión',
                'secuestro': 'secuestro',
                'secuestracion': 'secuestro',
                'no_detectada': 'no_detectada',
                'nodectada': 'no_detectada',
            };
            const lower = normalizado.tipo_hernia.toLowerCase().trim();
            normalizado.tipo_hernia = tipoMap[lower] || normalizado.tipo_hernia;
        }

        // Normalizar progresión
        if (normalizado.progresion) {
            const progMap: Record<string, string> = {
                'mejora': 'mejora',
                'estable': 'estable',
                'deterioro': 'deterioro',
                'deteriodo': 'deterioro',
                'primera_cita': 'primera_cita',
                'primera cita': 'primera_cita',
            };
            const lower = normalizado.progresion.toLowerCase().trim();
            normalizado.progresion = progMap[lower] || normalizado.progresion;
        }

        // Normalizar riesgo_quirurgico
        if (normalizado.riesgo_quirurgico) {
            const riesgoMap: Record<string, string> = {
                'bajo': 'bajo',
                'medio': 'medio',
                'alto': 'alto',
            };
            const lower = normalizado.riesgo_quirurgico.toLowerCase().trim();
            normalizado.riesgo_quirurgico = riesgoMap[lower] ||
                normalizado.riesgo_quirurgico;
        }

        // Normalizar tratamiento_indicado
        if (normalizado.tratamiento_indicado) {
            const tratMap: Record<string, string> = {
                'conservador': 'conservador',
                'infiltración': 'infiltración',
                'infiltracion': 'infiltración',
                'quirúrgico': 'quirúrgico',
                'quirurgico': 'quirúrgico',
            };
            const lower = normalizado.tratamiento_indicado.toLowerCase().trim();
            normalizado.tratamiento_indicado = tratMap[lower] ||
                normalizado.tratamiento_indicado;
        }

        return normalizado;
    }

    private parsearRespuestaGemini(raw: string): Record<string, any> {
        try {
            // Limpiar posibles bloques markdown que Gemini a veces agrega
            const limpio = raw
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();

            const parsed = JSON.parse(limpio);
            return parsed;
        } catch (err) {
            this.logger.error('Error parseando respuesta de Gemini:', raw);
            throw new BadRequestException('Gemini devolvió una respuesta no parseable como JSON');
        }
    }
}