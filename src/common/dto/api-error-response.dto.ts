import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({
    description:
      'A single error message or a list of request validation messages.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['email must be an email'],
  })
  message!: string | string[];

  @ApiProperty({ example: '/auth/register' })
  path!: string;

  @ApiProperty({
    example: '2026-09-20T07:00:00.000Z',
    format: 'date-time',
  })
  timestamp!: string;
}
