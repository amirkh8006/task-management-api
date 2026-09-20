import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';

interface NormalizedException {
  statusCode: number;
  error: string;
  message: string | string[];
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const normalized = this.normalize(exception);

    if (normalized.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.path} failed with ${this.exceptionName(exception)}`,
      );
    }

    response.status(normalized.statusCode).json({
      ...normalized,
      path: request.path,
      timestamp: new Date().toISOString(),
    });
  }

  private normalize(exception: unknown): NormalizedException {
    if (this.isDuplicateKeyError(exception)) {
      return this.fromHttpException(
        new ConflictException(
          'An account with this email address already exists',
        ),
      );
    }

    if (this.isMongooseValidationError(exception)) {
      return this.fromHttpException(
        new BadRequestException('Request validation failed'),
      );
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    return {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal server error',
    };
  }

  private fromHttpException(exception: HttpException): NormalizedException {
    const statusCode = exception.getStatus();

    if (statusCode >= 500) {
      return {
        statusCode,
        error: STATUS_CODES[statusCode] ?? 'Internal Server Error',
        message: 'Internal server error',
      };
    }

    const response = exception.getResponse();
    const responseBody =
      typeof response === 'object' && response !== null ? response : undefined;
    const responseMessage =
      responseBody && 'message' in responseBody
        ? responseBody.message
        : response;

    if (
      statusCode === 400 &&
      typeof responseMessage === 'string' &&
      this.isJsonParseMessage(responseMessage)
    ) {
      return {
        statusCode,
        error: 'Bad Request',
        message: 'Malformed JSON request body',
      };
    }

    const message = this.isMessage(responseMessage)
      ? responseMessage
      : (STATUS_CODES[statusCode] ?? 'Request failed');
    const error =
      responseBody &&
      'error' in responseBody &&
      typeof responseBody.error === 'string'
        ? responseBody.error
        : (STATUS_CODES[statusCode] ?? 'Request Error');

    return { statusCode, error, message };
  }

  private isMessage(value: unknown): value is string | string[] {
    return (
      typeof value === 'string' ||
      (Array.isArray(value) &&
        value.every((entry) => typeof entry === 'string'))
    );
  }

  private isJsonParseMessage(message: string): boolean {
    return (
      message.includes('JSON') ||
      message.startsWith('Unexpected token') ||
      message.startsWith('Unexpected end')
    );
  }

  private isDuplicateKeyError(error: unknown): error is { code: number } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }

  private isMongooseValidationError(error: unknown): error is { name: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error.name === 'ValidationError' || error.name === 'CastError')
    );
  }

  private exceptionName(exception: unknown): string {
    return exception instanceof Error ? exception.name : 'UnknownException';
  }
}
