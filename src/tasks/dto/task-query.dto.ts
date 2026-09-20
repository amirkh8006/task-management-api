import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

export const DEFAULT_TASK_PAGE = 1;
export const DEFAULT_TASK_PAGE_SIZE = 10;
export const MAX_TASK_PAGE_SIZE = 100;

function transformIntegerQueryValue(value: unknown): unknown {
  return typeof value === 'string' && /^\d+$/.test(value)
    ? Number(value)
    : value;
}

export class TaskQueryDto {
  @ApiPropertyOptional({
    description: 'One-based result page.',
    default: DEFAULT_TASK_PAGE,
    minimum: 1,
    type: Number,
  })
  @Transform(({ value }: { value: unknown }) =>
    transformIntegerQueryValue(value),
  )
  @IsInt()
  @Min(1)
  page: number = DEFAULT_TASK_PAGE;

  @ApiPropertyOptional({
    description: `Results per page, up to ${MAX_TASK_PAGE_SIZE}.`,
    default: DEFAULT_TASK_PAGE_SIZE,
    minimum: 1,
    maximum: MAX_TASK_PAGE_SIZE,
    type: Number,
  })
  @Transform(({ value }: { value: unknown }) =>
    transformIntegerQueryValue(value),
  )
  @IsInt()
  @Min(1)
  @Max(MAX_TASK_PAGE_SIZE)
  limit: number = DEFAULT_TASK_PAGE_SIZE;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.Completed })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.High })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description:
      'Case-insensitive, token-based search across task titles and descriptions.',
    example: 'nestjs',
    minLength: 1,
    maxLength: 200,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  search?: string;
}
