// src/notificaciones/notificaciones.module.ts

import { Module } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';

@Module({
    providers: [NotificacionesService],
    exports: [NotificacionesService],   // exportado para DiagnosticoModule
})
export class NotificacionesModule { }