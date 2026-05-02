import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillsModule } from './modules/bills/bills.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { SplitEngineModule } from './modules/split-engine/split-engine.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
      }),
    }),
    PrismaModule,
    AuthModule,
    BillsModule,
    OcrModule,
    SplitEngineModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
