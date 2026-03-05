import {
    Controller,
    Get,
    Post,
    Delete,
    Patch,
    Param,
    Body,
    ParseIntPipe,
    UseInterceptors,
    UploadedFiles,
    Res,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiConsumes,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ImagenesService } from './imagenes.service';
import { UploadImagenDto } from './dto/upload-imagen.dto';
import { MulterFile } from '../../integrations/detection/types/multer-file.type';

@ApiTags('Imágenes RM')
@ApiBearerAuth()
@Controller('imagenes')
export class ImagenesController {
    constructor(private readonly imagenesService: ImagenesService) { }

    // POST /imagenes/upload
    // Acepta hasta 10 archivos en el campo "files"
    @Post('upload')
    @UseInterceptors(
        FilesInterceptor('files', 10, {
            storage: memoryStorage(),   // buffer en memoria, el service decide dónde persiste
            limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB por archivo
        }),
    )
    @ApiOperation({ summary: 'Subir una o varias imágenes RM para una cita' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: { type: 'array', items: { type: 'string', format: 'binary' } },
                citaId: { type: 'number', example: 1 },
                marcarPrincipal: { type: 'boolean', example: true },
            },
            required: ['files', 'citaId'],
        },
    })
    upload(
        @UploadedFiles() files: MulterFile[],
        @Body() dto: UploadImagenDto,
    ) {
        return this.imagenesService.uploadMultiple(files, dto);
    }

    // GET /imagenes/cita/:citaId
    @Get('cita/:citaId')
    @ApiOperation({ summary: 'Listar todas las imágenes de una cita' })
    @ApiParam({ name: 'citaId', type: 'number' })
    findByCita(@Param('citaId', ParseIntPipe) citaId: number) {
        return this.imagenesService.findByCita(citaId);
    }

    // GET /imagenes/cita/:citaId/principal
    @Get('cita/:citaId/principal')
    @ApiOperation({ summary: 'Obtener la imagen principal de una cita (la que va a Gemini)' })
    @ApiParam({ name: 'citaId', type: 'number' })
    findPrincipal(@Param('citaId', ParseIntPipe) citaId: number) {
        return this.imagenesService.findPrincipal(citaId);
    }

    // GET /imagenes/:id
    @Get(':id')
    @ApiOperation({ summary: 'Metadatos de una imagen por ID' })
    @ApiParam({ name: 'id', type: 'number' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.imagenesService.findOne(id);
    }

    // GET /imagenes/:id/file  — sirve el archivo binario directamente
    @Get(':id/file')
    @ApiOperation({ summary: 'Descargar el archivo de imagen (para visualización en frontend)' })
    @ApiParam({ name: 'id', type: 'number' })
    async serveFile(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response,
    ) {
        const { buffer, mimeType, nombre } = await this.imagenesService.getBuffer(id);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${nombre}"`);
        res.send(buffer);
    }

    // PATCH /imagenes/:id/principal
    @Patch(':id/principal')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Marcar esta imagen como la principal de su cita' })
    @ApiParam({ name: 'id', type: 'number' })
    marcarPrincipal(@Param('id', ParseIntPipe) id: number) {
        return this.imagenesService.marcarPrincipal(id);
    }

    // DELETE /imagenes/:id
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar una imagen (borra el archivo físico y el registro)' })
    @ApiParam({ name: 'id', type: 'number' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.imagenesService.remove(id);
    }
}