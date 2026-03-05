import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { GoogleGenAI, Part } from '@google/genai';

const DEFAULT_MODEL = 'gemini-2.5-flash';

const MIME_AUDIO_MAP: Record<string, string> = {
    'audio/mpeg': 'audio/mp3',
    'audio/mp3': 'audio/mp3',
    'audio/wav': 'audio/wav',
    'audio/x-wav': 'audio/wav',
    'audio/ogg': 'audio/ogg',
    'audio/m4a': 'audio/mp4',
    'audio/mp4': 'audio/mp4',
    'audio/webm': 'audio/webm',
};

const MIME_IMAGE_MAP: Record<string, string> = {
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/png': 'image/png',
    'image/webp': 'image/webp',
    'image/dicom': 'image/png',
    'application/dicom': 'image/png',
};

@Injectable()
export class GeminiProvider {
    readonly name = 'gemini';

    private readonly logger = new Logger(GeminiProvider.name);
    private readonly ai: GoogleGenAI;

    constructor() {
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });
    }

    // ─── TEXTO → TEXTO ────────────────────────────────────────────────────────

    async call(systemPrompt: string, userMessage: string): Promise<string> {
        this.logger.log('GeminiProvider.call()');

        try {
            const response = await this.ai.models.generateContent({
                model: DEFAULT_MODEL,
                contents: `${systemPrompt}\n\n${userMessage}`,
                config: {
                    temperature: 0.2,
                    topP: 0.8,
                    maxOutputTokens: 2048,
                },
            });

            return response.text.trim();
        } catch (err) {
            this.handleError(err, 'call');
        }
    }

    // ─── IMAGEN + TEXTO → TEXTO ───────────────────────────────────────────────

    async callWithImage(
        systemPrompt: string,
        userMessage: string,
        image: { buffer: Buffer; mimeType: string },
    ): Promise<string> {
        this.logger.log('GeminiProvider.callWithImage()');

        const imagePart: Part = {
            inlineData: {
                data: image.buffer.toString('base64'),
                mimeType: MIME_IMAGE_MAP[image.mimeType] ?? 'image/jpeg',
            },
        };

        try {
            const response = await this.ai.models.generateContent({
                model: DEFAULT_MODEL,
                contents: [
                    { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userMessage}` }, imagePart] },
                ],
                config: {
                    temperature: 0.2,
                    topP: 0.8,
                    maxOutputTokens: 8192,
                },
            });

            return response.text.trim();
        } catch (err) {
            this.handleError(err, 'callWithImage');
        }
    }

    // ─── AUDIO → TEXTO ────────────────────────────────────────────────────────

    async transcribeAudio(audio: {
        buffer: Buffer;
        mimeType: string;
        originalname: string;
    }): Promise<string> {
        this.logger.log(`GeminiProvider.transcribeAudio() — ${audio.originalname}`);

        const audioPart: Part = {
            inlineData: {
                data: audio.buffer.toString('base64'),
                mimeType: MIME_AUDIO_MAP[audio.mimeType] ?? audio.mimeType,
            },
        };

        try {
            const response = await this.ai.models.generateContent({
                model: DEFAULT_MODEL,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: 'Transcribe the following audio exactly as spoken, preserving all medical terminology.' },
                            audioPart,
                        ],
                    },
                ],
                config: {
                    temperature: 0.0,
                    maxOutputTokens: 1024,
                },
            });

            const text = response.text.trim();

            if (!text) {
                throw new InternalServerErrorException('Gemini returned an empty transcription.');
            }

            return text;
        } catch (err) {
            this.handleError(err, 'transcribeAudio');
        }
    }

    // ─── ERROR HANDLER ────────────────────────────────────────────────────────

    private handleError(err: unknown, context: string): never {
        if (err instanceof InternalServerErrorException) throw err;
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`[${context}] ${message}`);
        throw new InternalServerErrorException(`Gemini error [${context}]: ${message}`);
    }
}