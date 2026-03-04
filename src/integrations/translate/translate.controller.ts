import { Body, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TranslateService } from './translate.service';
import { TranscribeRequestDto } from './dto/transcribe.dto';
import { MulterFile } from './types/multer-file.type';

@ApiTags('Hernia - Translate')
@ApiBearerAuth()
@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Get('models')
  @ApiOperation({ summary: 'Lista de modelos de transcripción disponibles' })
  getModels() {
    return this.translateService.getModels();
  }

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiOperation({ summary: 'Transcripción de audio a texto' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['audio'],
      properties: {
        audio: { type: 'string', format: 'binary' },
        model: { type: 'string', example: 'whisper-small' },
        language: { type: 'string', example: 'es' },
      },
    },
  })
  transcribe(@UploadedFile() audio: MulterFile, @Body() body: TranscribeRequestDto) {
    return this.translateService.transcribe(audio, body.model, body.language);
  }
}
