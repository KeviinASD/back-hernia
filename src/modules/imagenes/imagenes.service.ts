import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { UploadImagenDto } from './dto/upload-imagen.dto';
import { ImagenRm } from './entities/imagenes.entity';
import { MulterFile } from '../../integrations/detection/types/multer-file.type';

// Tipos de archivo permitidos para imágenes RM
const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/dicom', 'application/dicom'];
const MAX_SIZE_MB = 20;

@Injectable()
export class ImagenesService {
    private readonly storageBase: string;
    private readonly useS3: boolean;

    constructor(
        @InjectRepository(ImagenRm)
        private readonly imagenRepo: Repository<ImagenRm>,
        private readonly configService: ConfigService,
        private readonly dataSource: DataSource,
    ) {
        this.storageBase = this.configService.get<string>('STORAGE_LOCAL_PATH', './storage/imagenes');
        this.useS3 = this.configService.get<string>('STORAGE_TYPE') === 's3';
    }

    // ─── SUBIR MÚLTIPLES IMÁGENES PARA UNA CITA ─────────────────────────────

    async uploadMultiple(
        files: MulterFile[],
        dto: UploadImagenDto,
    ): Promise<ImagenRm[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('Debes subir al menos una imagen.');
        }

        // Validar cada archivo
        for (const file of files) {
            this.validarArchivo(file);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const imagenes: ImagenRm[] = [];

            // Si se marca principal, limpiar el flag previo de la cita
            if (dto.marcarPrincipal) {
                await queryRunner.manager.update(
                    ImagenRm,
                    { citaId: dto.citaId },
                    { esPrincipal: false },
                );
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const archivoPath = await this.guardarArchivo(file, dto.citaId);

                const imagen = queryRunner.manager.create(ImagenRm, {
                    citaId: dto.citaId,
                    archivoPath,
                    archivoNombre: file.originalname,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    // Primera imagen del lote es la principal si se pidió
                    esPrincipal: dto.marcarPrincipal && i === 0,
                });

                imagenes.push(await queryRunner.manager.save(ImagenRm, imagen));
            }

            await queryRunner.commitTransaction();
            return imagenes;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException(`Error al guardar imágenes: ${err.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    // ─── OBTENER IMÁGENES DE UNA CITA ────────────────────────────────────────

    async findByCita(citaId: number): Promise<ImagenRm[]> {
        return this.imagenRepo.find({
            where: { citaId },
            order: { esPrincipal: 'DESC', createdAt: 'ASC' },
        });
    }

    // ─── OBTENER IMAGEN PRINCIPAL DE UNA CITA ────────────────────────────────

    async findPrincipal(citaId: number): Promise<ImagenRm | null> {
        return this.imagenRepo.findOne({
            where: { citaId, esPrincipal: true },
        });
    }

    // ─── OBTENER UNA IMAGEN POR ID ────────────────────────────────────────────

    async findOne(id: number): Promise<ImagenRm> {
        const imagen = await this.imagenRepo.findOne({ where: { id } });
        if (!imagen) throw new NotFoundException(`Imagen con ID "${id}" no encontrada.`);
        return imagen;
    }

    // ─── LEER BUFFER DE UNA IMAGEN (para enviar a Gemini / YOLO) ─────────────

    async getBuffer(id: number): Promise<{ buffer: Buffer; mimeType: string; nombre: string }> {
        const imagen = await this.findOne(id);

        if (this.useS3) {
            // TODO: implementar descarga desde S3
            throw new InternalServerErrorException('S3 aún no implementado.');
        }

        const fullPath = path.resolve(imagen.archivoPath);
        if (!fs.existsSync(fullPath)) {
            throw new NotFoundException(`Archivo físico no encontrado: ${fullPath}`);
        }

        return {
            buffer: fs.readFileSync(fullPath),
            mimeType: imagen.mimeType,
            nombre: imagen.archivoNombre,
        };
    }

    // ─── MARCAR COMO PRINCIPAL ────────────────────────────────────────────────

    async marcarPrincipal(id: number): Promise<ImagenRm> {
        const imagen = await this.findOne(id);

        // Quitar flag de todas las imágenes de esa cita
        await this.imagenRepo.update({ citaId: imagen.citaId }, { esPrincipal: false });

        imagen.esPrincipal = true;
        return this.imagenRepo.save(imagen);
    }

    // ─── ELIMINAR IMAGEN ──────────────────────────────────────────────────────

    async remove(id: number): Promise<void> {
        const imagen = await this.findOne(id);

        // Borrar archivo físico si es local
        if (!this.useS3) {
            const fullPath = path.resolve(imagen.archivoPath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        await this.imagenRepo.remove(imagen);
    }

    // ─── HELPERS PRIVADOS ─────────────────────────────────────────────────────

    private validarArchivo(file: MulterFile): void {
        if (!MIME_PERMITIDOS.includes(file.mimetype)) {
            throw new BadRequestException(
                `Tipo de archivo no permitido: ${file.mimetype}. Permitidos: JPEG, PNG, DICOM.`,
            );
        }

        const sizeMb = file.size / (1024 * 1024);
        if (sizeMb > MAX_SIZE_MB) {
            throw new BadRequestException(
                `El archivo "${file.originalname}" supera el límite de ${MAX_SIZE_MB}MB.`,
            );
        }
    }

    private async guardarArchivo(file: MulterFile, citaId: number): Promise<string> {
        if (this.useS3) {
            return this.subirS3(file, citaId);
        }
        return this.guardarLocal(file, citaId);
    }

    private guardarLocal(file: MulterFile, citaId: number): string {
        const carpeta = path.join(this.storageBase, `cita_${citaId}`);
        if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true });

        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const nombreFinal = `${timestamp}_${file.originalname.replace(/\s+/g, '_')}`;
        const destino = path.join(carpeta, nombreFinal);

        fs.writeFileSync(destino, file.buffer);
        return destino;
    }

    private async subirS3(file: MulterFile, citaId: number): Promise<string> {
        // Placeholder — integrar @aws-sdk/client-s3 según configuración
        // const s3Key = `imagenes/cita_${citaId}/${Date.now()}_${file.originalname}`;
        // await s3Client.send(new PutObjectCommand({ Bucket, Key: s3Key, Body: file.buffer, ContentType: file.mimetype }));
        // return s3Key;
        throw new InternalServerErrorException('S3 upload pendiente de configuración.');
    }
}