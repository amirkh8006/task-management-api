import { Injectable } from '@nestjs/common';

import { TaskResponseDto } from '../tasks/dto/task-response.dto';
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

  findAllTasks(): Promise<TaskResponseDto[]> {
    return this.tasksService.findAllForAdmin();
  }

  deleteTask(taskId: string): Promise<void> {
    return this.tasksService.deleteAsAdmin(taskId);
  }
}
