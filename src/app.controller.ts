import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AppService, type HealthResponse } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Check whether the API is running' })
  @ApiOkResponse({
    description: 'The API process is healthy.',
    schema: {
      example: {
        status: 'ok',
        service: 'task-management-api',
        timestamp: '2026-09-20T06:30:00.000Z',
      },
    },
  })
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}
