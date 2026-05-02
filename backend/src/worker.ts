import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { OcrProcessor, OCR_QUEUE } from './modules/ocr/ocr.processor';
import { GeminiOcrService } from './modules/ocr/gemini-ocr.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
      }),
    }),
    BullModule.registerQueue({ name: OCR_QUEUE }),
    PrismaModule,
  ],
  providers: [OcrProcessor, GeminiOcrService],
})
class WorkerModule {}

async function bootstrap() {
  await NestFactory.createApplicationContext(WorkerModule);
}
bootstrap();
