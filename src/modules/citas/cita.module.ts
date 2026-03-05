import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from './entities/cita.entity';
import { CitasController } from './cita.controller';
import { CitasService } from './cita.service';

@Module({
    imports: [TypeOrmModule.forFeature([Cita])],
    controllers: [CitasController],
    providers: [CitasService],
    exports: [CitasService], // exportado para que DiagnosticoModule lo consuma
})
export class CitasModule { }