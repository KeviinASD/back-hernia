import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { PredictResponseDto, PredictAllResponseDto } from '../dto/predict.dto';
import { MulterFile } from '../types/multer-file.type';

@Injectable()
export class DetectionService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.AI_BACKEND_URL ?? 'http://localhost:8000';
    this.apiKey  = process.env.AI_BACKEND_API_KEY ?? '';
  }

  async predict(
    file: MulterFile,
    model: string,
    conf: number,
    iou: number,
  ): Promise<PredictResponseDto> {
    const form = this.buildForm(file);
    form.append('model', model);
    form.append('conf',  String(conf));
    form.append('iou',   String(iou));

    try {
      const { data } = await axios.post<PredictResponseDto>(
        `${this.baseUrl}/predict`,
        form,
        { headers: { 'x-api-key': this.apiKey } },
      );
      return data;
    } catch (err) {
      this.handleAxiosError(err);
    }
  }

  async predictAll(
    file: MulterFile,
    conf: number,
    iou: number,
  ): Promise<PredictAllResponseDto> {
    const form = this.buildForm(file);
    form.append('conf', String(conf));
    form.append('iou',  String(iou));

    try {
      const { data } = await axios.post<PredictAllResponseDto>(
        `${this.baseUrl}/predict/all`,
        form,
        { headers: { 'x-api-key': this.apiKey } },
      );
      return data;
    } catch (err) {
      this.handleAxiosError(err);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private buildForm(file: MulterFile): FormData {
    const form = new FormData();
    form.append(
      'image',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      file.originalname,
    );
    return form;
  }

  private handleAxiosError(err: unknown): never {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<{ detail: string }>;
      const detail   = axiosErr.response?.data?.detail ?? axiosErr.message;
      const status   = axiosErr.response?.status ?? 500;
      throw new InternalServerErrorException(
        `AI backend error [${status}]: ${detail}`,
      );
    }
    throw new InternalServerErrorException('Unexpected error calling AI backend');
  }
}
