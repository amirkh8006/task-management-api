import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { User } from '../../users/schemas/user.schema';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

export type TaskDocument = HydratedDocument<Task>;

@Schema({ timestamps: true, versionKey: false })
export class Task {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 200 })
  title!: string;

  @Prop({ trim: true, maxlength: 2_000 })
  description?: string;

  @Prop({
    required: true,
    type: String,
    enum: TaskStatus,
    default: TaskStatus.Pending,
  })
  status!: TaskStatus;

  @Prop({
    required: true,
    type: String,
    enum: TaskPriority,
    default: TaskPriority.Medium,
  })
  priority!: TaskPriority;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: User.name,
    immutable: true,
  })
  user!: Types.ObjectId;

  createdAt!: Date;

  updatedAt!: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ user: 1, createdAt: -1, _id: -1 });
TaskSchema.index({ user: 1, status: 1, createdAt: -1, _id: -1 });
TaskSchema.index({ user: 1, priority: 1, createdAt: -1, _id: -1 });
TaskSchema.index({
  user: 1,
  status: 1,
  priority: 1,
  createdAt: -1,
  _id: -1,
});
TaskSchema.index({ createdAt: -1, _id: -1 });
TaskSchema.index({ status: 1, createdAt: -1, _id: -1 });
TaskSchema.index({ priority: 1, createdAt: -1, _id: -1 });
TaskSchema.index({ status: 1, priority: 1, createdAt: -1, _id: -1 });
TaskSchema.index(
  { title: 'text', description: 'text' },
  {
    name: 'task_title_description_text',
    weights: { title: 2, description: 1 },
  },
);
