import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DetectionService } from '../services/detection.service';
import {
  PredictAllRequestDto,
  PredictAllResponseDto,
  PredictRequestDto,
  PredictResponseDto,
} from '../dto/predict.dto';
import { MulterFile } from '../types/multer-file.type';

@ApiTags('Integrations - Detection')
@ApiBearerAuth()
@Controller('integrations')
export class DetectionController {
  constructor(private readonly detectionService: DetectionService) {}

  @Post('predict')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Inferencia con un modelo específico',
    description:
      'Envía una imagen de RM en escala de grises y corre inferencia con el modelo indicado. ' +
      'Devuelve las detecciones, imagen anotada en Base64 y métricas de resumen.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Imagen de RM + parámetros del modelo',
    schema: {
      type: 'object',
      required: ['image', 'model'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Imagen de RM en escala de grises (jpg / png)',
        },
        model: {
          type: 'string',
          description: 'Nombre del modelo a usar',
          example: 'yolo-hernia-v1',
        },
        conf: {
          type: 'number',
          description: 'Umbral de confianza (0–1)',
          default: 0.25,
          minimum: 0,
          maximum: 1,
        },
        iou: {
          type: 'number',
          description: 'Umbral IoU para NMS (0–1)',
          default: 0.45,
          minimum: 0,
          maximum: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Inferencia exitosa', type: PredictResponseDto })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Modelo no encontrado' })
  @ApiResponse({ status: 415, description: 'El archivo no es una imagen' })
  @ApiResponse({ status: 422, description: 'Imagen con color o sin detecciones' })
  predict(
    @UploadedFile() image: MulterFile,
    @Body() body: PredictRequestDto,
  ) {
    return this.detectionService.predict(image, body.model, body.conf ?? 0.25, body.iou ?? 0.45);
  }

  @Post('predict/all')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Inferencia con todos los modelos',
    description:
      'Envía una imagen de RM y corre inferencia con todos los modelos cargados en el backend Python. ' +
      'Devuelve el resultado individual de cada modelo y un consenso por mayoría.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Imagen de RM + parámetros de inferencia',
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Imagen de RM en escala de grises (jpg / png)',
        },
        conf: {
          type: 'number',
          description: 'Umbral de confianza (0–1)',
          default: 0.25,
          minimum: 0,
          maximum: 1,
        },
        iou: {
          type: 'number',
          description: 'Umbral IoU para NMS (0–1)',
          default: 0.45,
          minimum: 0,
          maximum: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Inferencia exitosa con todos los modelos', type: PredictAllResponseDto })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 415, description: 'El archivo no es una imagen' })
  @ApiResponse({ status: 422, description: 'Imagen con color o ningún modelo detectó discos' })
  @ApiResponse({ status: 503, description: 'No hay modelos cargados en el servidor' })
  predictAll(
    @UploadedFile() image: MulterFile,
    @Body() body: PredictAllRequestDto,
  ) {
    return this.detectionService.predictAll(image, body.conf ?? 0.25, body.iou ?? 0.45);
  }
}
