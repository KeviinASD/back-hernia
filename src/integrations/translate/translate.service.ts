import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { TranscribeResponseDto } from './dto/transcribe.dto';
import { MulterFile } from './types/multer-file.type';

@Injectable()
export class TranslateService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.AI_BACKEND_URL ?? 'http://localhost:8000';
    this.apiKey  = process.env.AI_BACKEND_API_KEY ?? '';
  }

  async transcribe(file: MulterFile, model?: string, language?: string): Promise<TranscribeResponseDto> {
    const form = this.buildForm(file);
    if (model) form.append('model', model);
    if (language) form.append('language', language);

    try {
      const { data } = await axios.post<TranscribeResponseDto>(
        `${this.baseUrl}/transcribe`,
        form,
        { headers: { 'x-api-key': this.apiKey } },
      );
      return data;
    } catch (err) {
      this.handleAxiosError(err);
    }
  }

  async getModels(): Promise<{ available_models: string[]; device?: string } > {
    try {
      const { data } = await axios.get<{ available_models: string[]; device?: string }>(
        `${this.baseUrl}/transcribe/models`,
        { headers: { 'x-api-key': this.apiKey } },
      );
      return data;
    } catch (err) {
      this.handleAxiosError(err);
    }
  }

  private buildForm(file: MulterFile): FormData {
    const form = new FormData();
    form.append(
      'audio',
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
