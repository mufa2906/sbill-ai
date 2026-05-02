import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { BillState } from '../bills/bill-state.machine';
import { OCR_QUEUE, OcrJobData } from './ocr.processor';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class OcrService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(OCR_QUEUE) private readonly ocrQueue: Queue,
  ) {}

  async uploadAndQueue(
    billId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: jpeg, png, webp');
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('File too large. Max: 10MB');
    }

    const bill = await this.prisma.bill.findUnique({ where: { id: billId } });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.ownerId !== userId) throw new BadRequestException('Forbidden');

    const ocrJob = await this.prisma.ocrJob.create({
      data: { billId, status: 'queued' },
    });

    await this.prisma.bill.update({
      where: { id: billId },
      data: { state: BillState.PROCESSING_OCR },
    });

    const jobData: OcrJobData = {
      ocrJobId: ocrJob.id,
      billId,
      imagePath: file.path,
    };

    await this.ocrQueue.add('process', jobData, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 3000 },
    });

    return { ocrJobId: ocrJob.id, status: 'queued' };
  }

  async getJobStatus(jobId: string) {
    const job = await this.prisma.ocrJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('OCR job not found');
    return job;
  }
}
