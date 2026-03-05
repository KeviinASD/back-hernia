// src/imagenes/imagenes.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImagenRm } from './entities/imagenes.entity';

@Injectable()
export class ImagenesService {

    constructor(
        @InjectRepository(ImagenRm)
        private readonly imagenRepo: Repository<ImagenRm>,
    ) { }

    // Guardar una o varias imágenes para una cita
    async guardarImagenes(
        citaId: string,
        archivos: Express.Multer.File[],
    ): Promise<ImagenRm[]> {
        const entidades = archivos.map((archivo) =>
            this.imagenRepo.create({
                citaId,
                datos: archivo.buffer,
                mimeType: archivo.mimetype,
                nombreArchivo: archivo.originalname,
                tamano_bytes: archivo.size,
            }),
        );
        return this.imagenRepo.save(entidades);
    }

    // Obtener todas las imágenes de una cita (con el buffer binario)
    async findByCita(citaId: string): Promise<ImagenRm[]> {
        const imagenes = await this.imagenRepo.find({ where: { citaId } });
        if (!imagenes.length)
            throw new NotFoundException(`No hay imágenes para la cita ${citaId}`);
        return imagenes;
    }

    // Obtener una imagen por ID (para servir al frontend como stream)
    async findOne(id: string): Promise<ImagenRm> {
        const imagen = await this.imagenRepo.findOne({ where: { id } });
        if (!imagen) throw new NotFoundException(`Imagen ${id} no encontrada`);
        return imagen;
    }

    // Marcar imagen como procesada por ML
    async marcarProcesada(id: string): Promise<void> {
        await this.imagenRepo.update(id, { mlProcesada: true });
    }
}