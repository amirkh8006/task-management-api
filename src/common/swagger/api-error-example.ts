import type { ApiErrorResponseDto } from '../dto/api-error-response.dto';

export function apiErrorExample(
  statusCode: number,
  error: string,
  message: string | string[],
  path: string,
): ApiErrorResponseDto {
  return {
    statusCode,
    error,
    message,
    path,
    timestamp: '2026-09-20T07:00:00.000Z',
  };
}
