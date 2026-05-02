import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SplitEngineService } from './split-engine.service';

@UseGuards(JwtAuthGuard)
@Controller('bills/:billId/split')
export class SplitEngineController {
  constructor(private readonly splitEngineService: SplitEngineService) {}

  @Get()
  calculate(@Param('billId') billId: string) {
    return this.splitEngineService.calculate(billId);
  }
}
