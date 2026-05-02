import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BillState, canTransition } from './bill-state.machine';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillItemsDto } from './dto/update-bill-items.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { AssignItemsDto } from './dto/assign-items.dto';

@Injectable()
export class BillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBillDto) {
    return this.prisma.bill.create({
      data: {
        ownerId: userId,
        title: dto.title,
        state: BillState.DRAFT,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        items: { include: { assignments: true } },
        participants: true,
        ocrJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.ownerId !== userId) throw new ForbiddenException();
    return bill;
  }

  async findAll(userId: string) {
    return this.prisma.bill.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { ocrJobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  async updateItems(id: string, userId: string, dto: UpdateBillItemsDto) {
    const bill = await this.getBillOwned(id, userId);
    this.assertEditable(bill.state as BillState);

    await this.prisma.$transaction(async (tx) => {
      await tx.billItem.deleteMany({ where: { billId: id } });

      const items = await Promise.all(
        dto.items.map((item) =>
          tx.billItem.create({
            data: {
              billId: id,
              name: item.name,
              quantity: item.quantity,
              price: BigInt(item.price),
            },
          }),
        ),
      );

      const subtotal = items.reduce(
        (acc, item) => acc + item.price * BigInt(item.quantity),
        0n,
      );
      const taxAmount = BigInt(dto.taxAmount);
      const serviceChargeAmount = BigInt(dto.serviceChargeAmount);
      const total = subtotal + taxAmount + serviceChargeAmount;

      await tx.bill.update({
        where: { id },
        data: {
          subtotal,
          taxAmount,
          serviceChargeAmount,
          total,
          state: bill.state === BillState.DRAFT ? BillState.EDITING : bill.state,
        },
      });
    });

    return this.findOne(id, userId);
  }

  async addParticipant(billId: string, userId: string, dto: AddParticipantDto) {
    await this.getBillOwned(billId, userId);
    if (!dto.userId && !dto.guestName) {
      throw new BadRequestException('userId or guestName required');
    }
    return this.prisma.participant.create({
      data: { billId, userId: dto.userId, guestName: dto.guestName },
    });
  }

  async removeParticipant(billId: string, participantId: string, userId: string) {
    await this.getBillOwned(billId, userId);
    await this.prisma.participant.delete({ where: { id: participantId } });
  }

  async assignItems(billId: string, userId: string, dto: AssignItemsDto) {
    await this.getBillOwned(billId, userId);

    await this.prisma.$transaction(async (tx) => {
      const itemIds = [...new Set(dto.assignments.map((a) => a.itemId))];
      for (const itemId of itemIds) {
        await tx.itemAssignment.deleteMany({ where: { itemId } });
      }
      await tx.itemAssignment.createMany({
        data: dto.assignments.map((a) => ({
          itemId: a.itemId,
          participantId: a.participantId,
          ratio: a.ratio,
        })),
      });
    });

    return this.findOne(billId, userId);
  }

  async finalize(id: string, userId: string) {
    const bill = await this.getBillOwned(id, userId);
    if (!canTransition(bill.state as BillState, BillState.FINALIZED)) {
      throw new BadRequestException(`Cannot finalize bill in state ${bill.state}`);
    }
    return this.prisma.bill.update({
      where: { id },
      data: { state: BillState.FINALIZED },
    });
  }

  async remove(id: string, userId: string) {
    const bill = await this.getBillOwned(id, userId);
    if (bill.state === BillState.FINALIZED || bill.state === BillState.ARCHIVED) {
      throw new ForbiddenException('Cannot delete finalized or archived bill');
    }
    await this.prisma.bill.delete({ where: { id } });
  }

  private async getBillOwned(id: string, userId: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.ownerId !== userId) throw new ForbiddenException();
    return bill;
  }

  private assertEditable(state: BillState) {
    const editable = [BillState.DRAFT, BillState.READY, BillState.EDITING];
    if (!editable.includes(state)) {
      throw new BadRequestException(`Bill in state ${state} cannot be edited`);
    }
  }
}
