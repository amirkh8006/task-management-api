import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { apiErrorExample } from '../common/swagger/api-error-example';
import { TaskResponseDto } from '../tasks/dto/task-response.dto';
import { AdminService } from './admin.service';

const taskIdParameter = {
  name: 'id',
  description: 'MongoDB ObjectId of any task.',
  example: '66bf312225f21465bfc93d5c',
};

@ApiTags('Admin - Tasks')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  description: 'The access token is missing, invalid, or expired.',
  type: ApiErrorResponseDto,
  example: apiErrorExample(401, 'Unauthorized', 'Unauthorized', '/admin/tasks'),
})
@ApiForbiddenResponse({
  description: 'The authenticated user does not have the admin role.',
  type: ApiErrorResponseDto,
  example: apiErrorExample(
    403,
    'Forbidden',
    'Forbidden resource',
    '/admin/tasks',
  ),
})
@Roles(UserRole.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/tasks')
export class AdminTasksController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'List all tasks across all users (admin only)' })
  @ApiOkResponse({
    description: 'All tasks across all owners.',
    type: TaskResponseDto,
    isArray: true,
  })
  findAll(): Promise<TaskResponseDto[]> {
    return this.adminService.findAllTasks();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete any task by ID (admin only)' })
  @ApiParam(taskIdParameter)
  @ApiNoContentResponse({ description: 'The task was deleted.' })
  @ApiBadRequestResponse({
    description: 'The task ID is malformed.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      400,
      'Bad Request',
      'Invalid task ID',
      '/admin/tasks/not-an-object-id',
    ),
  })
  @ApiNotFoundResponse({
    description: 'The task does not exist.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      404,
      'Not Found',
      'Task not found',
      '/admin/tasks/66bf312225f21465bfc93d5c',
    ),
  })
  delete(@Param('id') taskId: string): Promise<void> {
    return this.adminService.deleteTask(taskId);
  }
}
