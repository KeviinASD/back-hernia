import { Body, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DetectionService } from './detection.service';
import { PredictAllRequestDto, PredictRequestDto } from './dto/predict.dto';
import { MulterFile } from './types/multer-file.type';

@ApiTags('Hernia - Detection')
@ApiBearerAuth()
@Controller('hernia')
export class DetectionController {
  constructor(private readonly detectionService: DetectionService) {}

  @Get('models')
  @ApiOperation({ summary: 'Lista de modelos disponibles y dispositivo en uso' })
  getModels() {
    return this.detectionService.getModels();
  }

  @Post('predict')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Inferencia con un modelo específico' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image', 'model'],
      properties: {
        image: { type: 'string', format: 'binary' },
        model: { type: 'string', example: 'yolo-hernia-v1' },
        conf:  { type: 'number', default: 0.25 },
        iou:   { type: 'number', default: 0.45 },
      },
    },
  })
  predict(@UploadedFile() image: MulterFile, @Body() body: PredictRequestDto) {
    return this.detectionService.predict(image, body.model, body.conf ?? 0.25, body.iou ?? 0.45);
  }

  @Post('predict/all')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Inferencia con todos los modelos' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        image: { type: 'string', format: 'binary' },
        conf:  { type: 'number', default: 0.25 },
        iou:   { type: 'number', default: 0.45 },
      },
    },
  })
  predictAll(@UploadedFile() image: MulterFile, @Body() body: PredictAllRequestDto) {
    return this.detectionService.predictAll(image, body.conf ?? 0.25, body.iou ?? 0.45);
  }
}
