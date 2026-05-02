import { Module } from '@nestjs/common';
import { SplitEngineController } from './split-engine.controller';
import { SplitEngineService } from './split-engine.service';

@Module({
  controllers: [SplitEngineController],
  providers: [SplitEngineService],
  exports: [SplitEngineService],
})
export class SplitEngineModule {}
