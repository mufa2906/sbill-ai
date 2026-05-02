import {
  Controller,
  Get,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OcrService } from './ocr.service';

@UseGuards(JwtAuthGuard)
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.STORAGE_PATH ?? './uploads',
        filename: (_, file, cb) => {
          const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('billId') billId: string,
  ) {
    return this.ocrService.uploadAndQueue(billId, req.user.id, file);
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.ocrService.getJobStatus(id);
  }
}
