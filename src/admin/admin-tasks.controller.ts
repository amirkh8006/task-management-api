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
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
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
})
@ApiForbiddenResponse({
  description: 'The authenticated user does not have the admin role.',
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
  @ApiBadRequestResponse({ description: 'The task ID is malformed.' })
  @ApiNotFoundResponse({ description: 'The task does not exist.' })
  delete(@Param('id') taskId: string): Promise<void> {
    return this.adminService.deleteTask(taskId);
  }
}
