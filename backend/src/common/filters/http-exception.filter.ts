import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    const code = exception instanceof HttpException
      ? (exception.getResponse() as any)?.error || 'HTTP_EXCEPTION'
      : 'INTERNAL_ERROR';

    if (status >= 500) {
      this.logger.error(`Unhandled exception: ${String(exception)}`, (exception as any)?.stack);
    }

    response.status(status).json({
      success: false,
      data: null,
      error: { code, message },
    });
  }
}
