import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

export class TaskResponseDto {
  @ApiProperty({ example: '66bf312225f21465bfc93d5c' })
  id!: string;

  @ApiProperty({ example: 'Learn NestJS' })
  title!: string;

  @ApiPropertyOptional({ example: 'Study guards and interceptors' })
  description?: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.Pending })
  status!: TaskStatus;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.High })
  priority!: TaskPriority;

  @ApiProperty({
    description: 'ID of the user who owns the task.',
    example: '66bf30f125f21465bfc93d57',
  })
  user!: string;

  @ApiProperty({ example: '2026-09-20T07:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-20T07:00:00.000Z' })
  updatedAt!: Date;
}
