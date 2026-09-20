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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
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
  @ApiBadRequestResponse({ description: 'The task data is invalid.' })
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(currentUser.id, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: "List the authenticated user's tasks" })
  @ApiOkResponse({
    description: 'Tasks owned by the authenticated user.',
    type: TaskResponseDto,
    isArray: true,
  })
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TaskResponseDto[]> {
    return this.tasksService.findAllForUser(currentUser.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an owned task' })
  @ApiParam(taskIdParameter)
  @ApiOkResponse({ description: 'The requested task.', type: TaskResponseDto })
  @ApiBadRequestResponse({ description: 'The task ID is malformed.' })
  @ApiNotFoundResponse({
    description: 'The task does not exist or belongs to another user.',
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
  })
  @ApiNotFoundResponse({
    description: 'The task does not exist or belongs to another user.',
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
  @ApiBadRequestResponse({ description: 'The task ID is malformed.' })
  @ApiNotFoundResponse({
    description: 'The task does not exist or belongs to another user.',
  })
  delete(
    @Param('id') taskId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.tasksService.deleteForUser(taskId, currentUser.id);
  }
}
