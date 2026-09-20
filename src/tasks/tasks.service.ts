import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateTaskDto } from './dto/create-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, type TaskDocument } from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
  ) {}

  async create(
    userId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.taskModel.create({
      ...createTaskDto,
      user: userId,
    });

    return this.toResponse(task);
  }

  async findAllForUser(userId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.taskModel
      .find({ user: userId })
      .sort({ createdAt: -1, _id: -1 })
      .exec();

    return tasks.map((task) => this.toResponse(task));
  }

  async findOneForUser(
    taskId: string,
    userId: string,
  ): Promise<TaskResponseDto> {
    this.assertValidTaskId(taskId);

    const task = await this.taskModel
      .findOne({ _id: taskId, user: userId })
      .exec();

    return this.requireTask(task);
  }

  async updateForUser(
    taskId: string,
    userId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    this.assertValidTaskId(taskId);

    const task = await this.taskModel
      .findOneAndUpdate(
        { _id: taskId, user: userId },
        { $set: updateTaskDto },
        { new: true, runValidators: true },
      )
      .exec();

    return this.requireTask(task);
  }

  async deleteForUser(taskId: string, userId: string): Promise<void> {
    this.assertValidTaskId(taskId);

    const task = await this.taskModel
      .findOneAndDelete({ _id: taskId, user: userId })
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }
  }

  private assertValidTaskId(taskId: string): void {
    if (!Types.ObjectId.isValid(taskId)) {
      throw new BadRequestException('Invalid task ID');
    }
  }

  private requireTask(task: TaskDocument | null): TaskResponseDto {
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.toResponse(task);
  }

  private toResponse(task: TaskDocument): TaskResponseDto {
    return {
      id: task._id.toString(),
      title: task.title,
      ...(task.description === undefined
        ? {}
        : { description: task.description }),
      status: task.status,
      priority: task.priority,
      user: task.user.toString(),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
