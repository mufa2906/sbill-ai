import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillItemsDto } from './dto/update-bill-items.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { AssignItemsDto } from './dto/assign-items.dto';

@UseGuards(JwtAuthGuard)
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateBillDto) {
    return this.billsService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.billsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.billsService.findOne(id, req.user.id);
  }

  @Put(':id/items')
  updateItems(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBillItemsDto,
  ) {
    return this.billsService.updateItems(id, req.user.id, dto);
  }

  @Post(':id/participants')
  addParticipant(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddParticipantDto,
  ) {
    return this.billsService.addParticipant(id, req.user.id, dto);
  }

  @Delete(':id/participants/:participantId')
  removeParticipant(
    @Request() req: any,
    @Param('id') id: string,
    @Param('participantId') participantId: string,
  ) {
    return this.billsService.removeParticipant(id, participantId, req.user.id);
  }

  @Put(':id/assignments')
  assignItems(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AssignItemsDto,
  ) {
    return this.billsService.assignItems(id, req.user.id, dto);
  }

  @Post(':id/finalize')
  finalize(@Request() req: any, @Param('id') id: string) {
    return this.billsService.finalize(id, req.user.id);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.billsService.remove(id, req.user.id);
  }
}
