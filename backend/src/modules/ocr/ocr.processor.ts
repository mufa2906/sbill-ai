import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiOcrService } from './gemini-ocr.service';
import { BillState } from '../bills/bill-state.machine';

export const OCR_QUEUE = 'ocr';

export interface OcrJobData {
  ocrJobId: string;
  billId: string;
  imagePath: string;
}

@Processor(OCR_QUEUE)
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiOcrService,
  ) {}

  @Process('process')
  async processReceipt(job: Job<OcrJobData>) {
    const { ocrJobId, billId, imagePath } = job.data;

    await this.prisma.ocrJob.update({
      where: { id: ocrJobId },
      data: { status: 'processing' },
    });

    try {
      const result = await this.gemini.extractReceipt(imagePath);

      const subtotal = result.items.reduce(
        (acc: number, item: any) => acc + item.price * item.quantity,
        0,
      );
      const computedTotal = subtotal + (result.taxAmount ?? 0) + (result.serviceChargeAmount ?? 0);
      const tolerance = 100;
      const isValid = Math.abs(computedTotal - (result.total ?? computedTotal)) <= tolerance;

      if (!isValid) {
        const retried = job.attemptsMade > 0;
        if (!retried) {
          throw new Error('OCR_VALIDATION_FAILED');
        }
        await this.markRequiresReview(ocrJobId, billId, result, 'Total mismatch after retry');
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.billItem.deleteMany({ where: { billId } });
        for (const item of result.items) {
          await tx.billItem.create({
            data: {
              billId,
              name: item.name,
              quantity: item.quantity ?? 1,
              price: BigInt(item.price ?? 0),
              normalizedName: item.name.toLowerCase().trim(),
            },
          });
        }

        const taxAmount = BigInt(result.taxAmount ?? 0);
        const serviceChargeAmount = BigInt(result.serviceChargeAmount ?? 0);
        const subtotalBig = result.items.reduce(
          (acc: bigint, item: any) => acc + BigInt(item.price ?? 0) * BigInt(item.quantity ?? 1),
          0n,
        );

        await tx.bill.update({
          where: { id: billId },
          data: {
            subtotal: subtotalBig,
            taxAmount,
            serviceChargeAmount,
            total: subtotalBig + taxAmount + serviceChargeAmount,
            state: BillState.READY,
          },
        });

        await tx.ocrJob.update({
          where: { id: ocrJobId },
          data: {
            status: 'completed',
            confidenceScore: result.confidence ?? null,
            rawResponse: result as any,
          },
        });
      });
    } catch (error: any) {
      if (error.message === 'OCR_VALIDATION_FAILED') throw error;
      this.logger.error(`OCR failed for job ${ocrJobId}`, error);
      await this.markFailed(ocrJobId, billId, error.message);
    }
  }

  private async markRequiresReview(
    ocrJobId: string,
    billId: string,
    rawResponse: any,
    reason: string,
  ) {
    await this.prisma.ocrJob.update({
      where: { id: ocrJobId },
      data: { status: 'requires_review', rawResponse, errorMessage: reason },
    });
    await this.prisma.bill.update({
      where: { id: billId },
      data: { state: BillState.EDITING },
    });
  }

  private async markFailed(ocrJobId: string, billId: string, reason: string) {
    await this.prisma.ocrJob.update({
      where: { id: ocrJobId },
      data: { status: 'failed', errorMessage: reason },
    });
    await this.prisma.bill.update({
      where: { id: billId },
      data: { state: BillState.EDITING },
    });
  }
}
