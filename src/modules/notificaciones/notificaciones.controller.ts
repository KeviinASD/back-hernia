// src/notificaciones/notificaciones.controller.ts

import {
    Controller, Post, Param, ParseIntPipe,
    HttpCode, HttpStatus, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotificacionesService } from './notificaciones.service';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Diagnostico } from '../diagnostico/entities/diagnostico.entity';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@Controller('notificaciones')
export class NotificacionesController {

    constructor(
        private readonly notificacionesService: NotificacionesService,
        @InjectRepository(Paciente)
        private readonly pacienteRepo: Repository<Paciente>,
        @InjectRepository(Diagnostico)
        private readonly diagnosticoRepo: Repository<Diagnostico>,
    ) { }

    // POST /notificaciones/paciente/:pacienteId/enviar-pdf
    @Post('paciente/:pacienteId/enviar-pdf')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({
        summary: 'Enviar PDF de resumen de tratamiento por WhatsApp al paciente',
        description: 'Genera el reporte PDF con el historial de diagnósticos y lo envía por WhatsApp vía n8n.',
    })
    async enviarPdf(
        @Param('pacienteId', ParseIntPipe) pacienteId: number,
        @ActiveUser() doctor: User,
    ) {
        const paciente = await this.pacienteRepo.findOne({ where: { id: pacienteId } });
        if (!paciente) throw new NotFoundException(`Paciente ${pacienteId} no encontrado`);

        const diagnosticos = await this.diagnosticoRepo.find({
            where: { pacienteId },
            order: { createdAt: 'ASC' },
        });

        // Lanzar el envío sin bloquear la respuesta HTTP
        this.notificacionesService
            .enviarPdfWhatsapp(paciente, diagnosticos, {
                nombre: doctor.username,
                apellido: doctor.email.split('@')[0],
            })
            .catch((err) => {
                console.log("erorr: ", err)
            });

        return { message: 'PDF en proceso de envío por WhatsApp' };
    }
}
