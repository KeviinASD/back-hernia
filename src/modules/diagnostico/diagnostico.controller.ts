// src/diagnostico/diagnostico.controller.ts

import {
    Controller, Post, Get, Put, Param, Body,
    UploadedFile, UseInterceptors, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AprobarDiagnosticoDto } from './dto/aprobar-diagnostico.dto';
import { DiagnosticoService } from './diagnostico.service';
import { IniciarDiagnosticoDto } from './dto/iniciar-diagnostico.dto';


@ApiTags('Diagnóstico IA')
@ApiBearerAuth()
@Controller('citas/:citaId/diagnostico')
export class DiagnosticoController {

    constructor(private readonly diagnosticoService: DiagnosticoService) { }

    // POST /citas/:citaId/diagnostico
    @Post()
    @ApiOperation({
        summary: 'Iniciar diagnóstico IA',
        description: `
Acepta **dos modos**:

**Modo producción** — multipart/form-data con campo \`audio\` (archivo) y opcionalmente \`textoManual\`

**Modo pruebas** — multipart/form-data con solo \`textoManual\` (sin audio)

En ambos casos las imágenes RM deben haber sido subidas previamente en \`POST /citas/:id/imagenes\`
    `,
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['modeloSeleccionado'],
            properties: {
                modeloSeleccionado: {
                    type: 'string',
                    description: 'Nombre del modelo YOLO seleccionado (el de mayor confianza)',
                    example: 'yolo-hernia-v2',
                },
                audio: {
                    type: 'string',
                    format: 'binary',
                    description: 'Archivo de audio (opcional en modo pruebas)',
                },
                textoManual: {
                    type: 'string',
                    description: 'Texto del dictado médico (alternativa al audio)',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('audio', {
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowed = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'];
            cb(null, allowed.includes(file.mimetype));
        },
    }))
    async procesarCita(
        @Param('citaId', ParseUUIDPipe) citaId: string,
        @UploadedFile() audio: Express.Multer.File | undefined,  // opcional
        @Body() dto: IniciarDiagnosticoDto,
    ) {
        return this.diagnosticoService.procesarCita(citaId, dto.modeloSeleccionado, audio, dto.textoManual);
    }

    // GET /citas/:citaId/diagnostico
    @Get()
    @ApiOperation({ summary: 'Obtener diagnóstico de una cita' })
    findByCita(@Param('citaId', ParseUUIDPipe) citaId: string) {
        return this.diagnosticoService.findByCita(citaId);
    }

    // PUT /citas/:citaId/diagnostico/aprobar
    @Put('aprobar')
    @ApiOperation({ summary: 'Doctor aprueba y valida el diagnóstico generado por IA' })
    aprobar(
        @Param('citaId', ParseUUIDPipe) citaId: string,
        @Body() dto: AprobarDiagnosticoDto,
    ) {
        return this.diagnosticoService.aprobar(citaId, dto);
    }

    // GET /diagnostico/tendencia/:pacienteId
    @Get('tendencia/:pacienteId')
    @ApiOperation({ summary: 'Datos de tendencia histórica del paciente para gráficas' })
    tendencia(@Param('pacienteId', ParseUUIDPipe) pacienteId: string) {
        return this.diagnosticoService.getTendencia(pacienteId);
    }
}