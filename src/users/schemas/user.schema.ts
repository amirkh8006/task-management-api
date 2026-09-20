import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { UserRole } from '../../common/enums/user-role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (_document, returnedObject: Record<string, unknown>) => {
      delete returnedObject.password;
      delete returnedObject._id;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_document, returnedObject: Record<string, unknown>) => {
      delete returnedObject.password;
      delete returnedObject._id;
    },
  },
})
export class User {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 100 })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.User })
  role!: UserRole;

  createdAt!: Date;

  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: -1, _id: -1 });
