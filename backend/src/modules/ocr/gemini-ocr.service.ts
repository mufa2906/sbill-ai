import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface OcrResult {
  items: Array<{ name: string; quantity: number; price: number }>;
  taxAmount: number;
  serviceChargeAmount: number;
  total: number;
  confidence: number;
}

@Injectable()
export class GeminiOcrService {
  private readonly logger = new Logger(GeminiOcrService.name);

  constructor(private readonly config: ConfigService) {}

  async extractReceipt(imagePath: string): Promise<OcrResult> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).slice(1).toLowerCase();
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

    const prompt = `You are a receipt OCR system. Extract all line items, tax, service charge, and total from this receipt.
Return ONLY valid JSON in this exact format, with no markdown or explanation:
{
  "items": [{"name": "string", "quantity": number, "price": number}],
  "taxAmount": number,
  "serviceChargeAmount": number,
  "total": number,
  "confidence": number
}
All prices must be integers in the smallest currency unit (e.g., rupiah, not thousands).
If a field is not found, use 0.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64Image } },
              ],
            },
          ],
          generationConfig: { temperature: 0, response_mime_type: 'application/json' },
        }),
      },
    );

    if (!response.ok) {
      const errBody = await response.text();
      this.logger.error(`Gemini ${response.status}: ${errBody}`);
      throw new Error(`Gemini API error: ${response.status} ${errBody}`);
    }

    const body = await response.json();
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    try {
      return JSON.parse(text) as OcrResult;
    } catch {
      this.logger.error('Failed to parse Gemini response', text);
      throw new Error('Invalid JSON from Gemini');
    }
  }
}
