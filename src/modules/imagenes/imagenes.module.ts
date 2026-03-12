import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ImagenesService } from './imagenes.service';
import { ImagenRm } from './entities/imagenes.entity';
import { ImagenesController } from './imagenes.controller';
import { AiModule } from 'src/integrations/ai/ai.module';
import { DetectionModule } from 'src/integrations/detection/detection.module';


@Module({
    imports: [
        TypeOrmModule.forFeature([ImagenRm]),
        ConfigModule,   // para leer STORAGE_TYPE, STORAGE_LOCAL_PATH, etc.
        AiModule,
        DetectionModule,
    ],
    controllers: [ImagenesController],
    providers: [ImagenesService],
    exports: [ImagenesService], // DiagnosticoModule lo necesita para leer buffers
})
export class ImagenesModule { }