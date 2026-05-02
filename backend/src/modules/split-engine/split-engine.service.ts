import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { roundMoney } from '../../common/utils/money.util';

export interface ParticipantTotal {
  participantId: string;
  name: string;
  itemSubtotal: bigint;
  taxShare: bigint;
  serviceChargeShare: bigint;
  total: bigint;
}

@Injectable()
export class SplitEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(billId: string): Promise<ParticipantTotal[]> {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
      include: {
        items: { include: { assignments: true } },
        participants: { include: { user: true } },
      },
    });

    if (!bill) throw new NotFoundException('Bill not found');

    const participantSubtotals = new Map<string, bigint>();
    for (const participant of bill.participants) {
      participantSubtotals.set(participant.id, 0n);
    }

    for (const item of bill.items) {
      const itemTotal = item.price * BigInt(item.quantity);
      for (const assignment of item.assignments) {
        const share = BigInt(roundMoney(Number(itemTotal) * Number(assignment.ratio)));
        const current = participantSubtotals.get(assignment.participantId) ?? 0n;
        participantSubtotals.set(assignment.participantId, current + share);
      }
    }

    const grandSubtotal = [...participantSubtotals.values()].reduce((a, b) => a + b, 0n);

    return bill.participants.map((participant) => {
      const itemSubtotal = participantSubtotals.get(participant.id) ?? 0n;

      const taxShare =
        grandSubtotal > 0n
          ? BigInt(roundMoney((Number(itemSubtotal) / Number(grandSubtotal)) * Number(bill.taxAmount)))
          : 0n;

      const serviceChargeShare =
        grandSubtotal > 0n
          ? BigInt(roundMoney((Number(itemSubtotal) / Number(grandSubtotal)) * Number(bill.serviceChargeAmount)))
          : 0n;

      return {
        participantId: participant.id,
        name: participant.user?.name ?? participant.guestName ?? 'Guest',
        itemSubtotal,
        taxShare,
        serviceChargeShare,
        total: itemSubtotal + taxShare + serviceChargeShare,
      };
    });
  }
}
