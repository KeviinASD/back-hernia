// src/diagnostico/diagnostico.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Diagnostico } from './entities/diagnostico.entity';
import { DiagnosticoService } from './diagnostico.service';
import { DiagnosticoController } from './diagnostico.controller';

import { ImagenesModule } from '../imagenes/imagenes.module';
import { HistoriaClinicaModule } from '../historia-clinica/historia-clinica.module';
import { CitasModule } from '../citas/cita.module';
import { DetectionModule } from 'src/integrations/detection/detection.module';
import { AiModule } from 'src/integrations/ai/ai.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Diagnostico]),
        CitasModule,            // necesita CitasService
        ImagenesModule,         // necesita ImagenesService
        HistoriaClinicaModule,  // necesita HistoriaClinicaService
        DetectionModule,        // necesita DetectionService (YOLO)
        AiModule,           // necesita GeminiProvider
        NotificacionesModule,   // necesita NotificacionesService (n8n)
    ],
    controllers: [DiagnosticoController],
    providers: [DiagnosticoService],
    exports: [DiagnosticoService],
})
export class DiagnosticoModule { }