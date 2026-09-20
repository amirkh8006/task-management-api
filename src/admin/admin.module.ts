import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { AdminTasksController } from './admin-tasks.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, UsersModule, TasksModule],
  controllers: [AdminUsersController, AdminTasksController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
