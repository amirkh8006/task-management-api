import { ApiProperty } from '@nestjs/swagger';

import { TaskResponseDto } from './task-response.dto';

export class PaginatedTasksResponseDto {
  @ApiProperty({ type: TaskResponseDto, isArray: true })
  data!: TaskResponseDto[];

  @ApiProperty({ example: 1, minimum: 1 })
  page!: number;

  @ApiProperty({ example: 10, minimum: 1, maximum: 100 })
  limit!: number;

  @ApiProperty({ example: 35, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 4, minimum: 0 })
  totalPages!: number;
}
