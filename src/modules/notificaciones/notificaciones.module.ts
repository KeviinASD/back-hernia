// src/notificaciones/notificaciones.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesController } from './notificaciones.controller';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Diagnostico } from '../diagnostico/entities/diagnostico.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Paciente, Diagnostico])],
    controllers: [NotificacionesController],
    providers: [NotificacionesService],
    exports: [NotificacionesService],
})
export class NotificacionesModule { }