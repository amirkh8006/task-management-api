import { Injectable } from '@nestjs/common';

import { PaginatedTasksResponseDto } from '../tasks/dto/paginated-tasks-response.dto';
import { TaskQueryDto } from '../tasks/dto/task-query.dto';
import { TasksService } from '../tasks/tasks.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tasksService: TasksService,
  ) {}

  findAllUsers(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  findUser(userId: string): Promise<UserResponseDto> {
    return this.usersService.findOne(userId);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.usersService.assertExists(userId);
    await this.tasksService.deleteAllForUser(userId);
    await this.usersService.delete(userId);
  }

  findAllTasks(query: TaskQueryDto): Promise<PaginatedTasksResponseDto> {
    return this.tasksService.findAllForAdmin(query);
  }

  deleteTask(taskId: string): Promise<void> {
    return this.tasksService.deleteAsAdmin(taskId);
  }
}
