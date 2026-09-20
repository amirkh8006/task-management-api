import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { apiErrorExample } from '../common/swagger/api-error-example';
import { CreateTaskDto } from './dto/create-task.dto';
import { PaginatedTasksResponseDto } from './dto/paginated-tasks-response.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

const taskIdParameter = {
  name: 'id',
  description: 'MongoDB ObjectId of a task owned by the authenticated user.',
  example: '66bf312225f21465bfc93d5c',
};

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  description: 'The access token is missing, invalid, or expired.',
  type: ApiErrorResponseDto,
  example: apiErrorExample(401, 'Unauthorized', 'Unauthorized', '/tasks'),
})
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task for the authenticated user' })
  @ApiCreatedResponse({
    description: 'The task was created successfully.',
    type: TaskResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The task data is invalid.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      400,
      'Bad Request',
      [
        'status must be one of the following values: pending, in_progress, completed',
      ],
      '/tasks',
    ),
  })
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(currentUser.id, createTaskDto);
  }

  @Get()
  @ApiOperation({
    summary: "List the authenticated user's tasks",
    description:
      'Returns newest tasks first. Search is case-insensitive and token-based across title and description.',
  })
  @ApiOkResponse({
    description: 'A page of tasks owned by the authenticated user.',
    type: PaginatedTasksResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'A pagination, filter, or search parameter is invalid.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      400,
      'Bad Request',
      ['page must not be less than 1'],
      '/tasks?page=0',
    ),
  })
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: TaskQueryDto,
  ): Promise<PaginatedTasksResponseDto> {
    return this.tasksService.findAllForUser(currentUser.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an owned task' })
  @ApiParam(taskIdParameter)
  @ApiOkResponse({ description: 'The requested task.', type: TaskResponseDto })
  @ApiBadRequestResponse({
    description: 'The task ID is malformed.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      400,
      'Bad Request',
      'Invalid task ID',
      '/tasks/not-an-object-id',
    ),
  })
  @ApiNotFoundResponse({
    description: 'The task does not exist or belongs to another user.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      404,
      'Not Found',
      'Task not found',
      '/tasks/66bf312225f21465bfc93d5c',
    ),
  })
  findOne(
    @Param('id') taskId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.findOneForUser(taskId, currentUser.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an owned task' })
  @ApiParam(taskIdParameter)
  @ApiOkResponse({ description: 'The updated task.', type: TaskResponseDto })
  @ApiBadRequestResponse({
    description: 'The task ID or update data is invalid.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      400,
      'Bad Request',
      'At least one task field must be provided',
      '/tasks/66bf312225f21465bfc93d5c',
    ),
  })
  @ApiNotFoundResponse({
    description: 'The task does not exist or belongs to another user.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      404,
      'Not Found',
      'Task not found',
      '/tasks/66bf312225f21465bfc93d5c',
    ),
  })
  update(
    @Param('id') taskId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.updateForUser(
      taskId,
      currentUser.id,
      updateTaskDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an owned task' })
  @ApiParam(taskIdParameter)
  @ApiNoContentResponse({ description: 'The task was deleted.' })
  @ApiBadRequestResponse({
    description: 'The task ID is malformed.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      400,
      'Bad Request',
      'Invalid task ID',
      '/tasks/not-an-object-id',
    ),
  })
  @ApiNotFoundResponse({
    description: 'The task does not exist or belongs to another user.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      404,
      'Not Found',
      'Task not found',
      '/tasks/66bf312225f21465bfc93d5c',
    ),
  })
  delete(
    @Param('id') taskId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.tasksService.deleteForUser(taskId, currentUser.id);
  }
}
