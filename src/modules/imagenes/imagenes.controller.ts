// src/imagenes/imagenes.controller.ts

import {
    Controller, Post, Get, Param, Res,
    UploadedFiles, UseInterceptors, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ImagenesService } from './imagenes.service';

@ApiTags('Imágenes RM')
@ApiBearerAuth()
@Controller('citas/:citaId/imagenes')
export class ImagenesController {

    constructor(private readonly imagenesService: ImagenesService) { }

    // POST /citas/:citaId/imagenes — subir imágenes RM
    @Post()
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FilesInterceptor('imagenes', 10, {
        limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB por imagen
        fileFilter: (_req, file, cb) => {
            const allowed = ['image/jpeg', 'image/png', 'image/webp'];
            cb(null, allowed.includes(file.mimetype));
        },
    }))
    async upload(
        @Param('citaId', ParseUUIDPipe) citaId: string,
        @UploadedFiles() archivos: Express.Multer.File[],
    ) {
        return this.imagenesService.guardarImagenes(citaId, archivos);
    }

    // GET /citas/:citaId/imagenes — listar imágenes (sin el buffer)
    @Get()
    async listar(@Param('citaId', ParseUUIDPipe) citaId: string) {
        const imgs = await this.imagenesService.findByCita(citaId);
        // No devolver el buffer binario en el listado
        return imgs.map(({ datos: _, ...meta }) => meta);
    }

    // GET /citas/:citaId/imagenes/:id/ver — servir imagen al navegador
    @Get(':id/ver')
    async verImagen(
        @Param('id', ParseUUIDPipe) id: string,
        @Res() res: Response,
    ) {
        const imagen = await this.imagenesService.findOne(id);
        res.setHeader('Content-Type', imagen.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${imagen.nombreArchivo}"`);
        res.send(imagen.datos);
    }
}