import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { OcrProcessor, OCR_QUEUE } from './ocr.processor';
import { GeminiOcrService } from './gemini-ocr.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: OCR_QUEUE }),
  ],
  controllers: [OcrController],
  providers: [OcrService, OcrProcessor, GeminiOcrService],
})
export class OcrModule {}
