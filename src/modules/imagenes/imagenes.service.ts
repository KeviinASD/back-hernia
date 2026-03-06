// src/imagenes/imagenes.service.ts

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImagenRm } from './entities/imagenes.entity';
import { GeminiProvider } from 'src/integrations/ai/providers/gemini.provider';

@Injectable()
export class ImagenesService {
    private readonly logger = new Logger(ImagenesService.name);

    constructor(
        @InjectRepository(ImagenRm)
        private readonly imagenRepo: Repository<ImagenRm>,
        private readonly geminiProvider: GeminiProvider,
    ) { }

    // Guardar una o varias imágenes para una cita
    async guardarImagenes(
        citaId: string,
        archivos: Express.Multer.File[],
    ): Promise<ImagenRm[]> {
        // Validar primero con IA antes de persistir
        await this.validateHerniasRM(archivos);

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
            return [];
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

    // funcion para validar que una imagen es de hernia en RM
    async validateHerniasRM(archivos: Express.Multer.File[]): Promise<void> {
        const resultados = await Promise.all(
            archivos.map((archivo) => this.validateHerniaRMWithAI(archivo)),
        );

        const invalidas = resultados
            .map((valida, i) => (!valida ? archivos[i].originalname : null))
            .filter(Boolean);

        if (invalidas.length > 0) {
            throw new BadRequestException(
                `Las siguientes imágenes no son resonancias magnéticas de hernia válidas: ${invalidas.join(', ')}`,
            );
        }
    }


    async validateHerniaRMWithAI(file: Express.Multer.File): Promise<boolean> {
        const prompt = `You are a medical imaging validation assistant.
    
Analyze this image and determine if it meets ALL of the following criteria:
1. It is a medical MRI (Magnetic Resonance Imaging) scan
2. It shows the lumbar spine or spinal region where hernias occur
3. It is in grayscale/black and white (as expected from MRI scans)
4. The image quality is sufficient to be a real medical scan

Respond ONLY with a JSON object in this exact format, no extra text:
{"valid": true} or {"valid": false, "reason": "brief explanation"}`;

        try {
            const response = await this.geminiProvider.callWithImage(
                prompt,
                'Validate this medical image.',
                {
                    buffer: file.buffer,
                    mimeType: file.mimetype,
                },
            );

            // Limpiar posibles backticks de markdown que Gemini a veces añade
            const clean = response.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(clean);

            if (!parsed.valid) {
                this.logger.warn(`Imagen inválida [${file.originalname}]: ${parsed.reason}`);
            }

            return parsed.valid === true;
        } catch (err) {
            this.logger.error(`Error validando imagen [${file.originalname}]: ${err.message}`);
            // Si la IA falla, rechazamos la imagen por seguridad
            return false;
        }
    }
}