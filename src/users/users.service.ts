import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UserResponseDto } from './dto/user-response.dto';
import type { CreateUserInput } from './interfaces/create-user.interface';
import type { UserWithPassword } from './interfaces/user-with-password.interface';
import { User, type UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(input: CreateUserInput): Promise<UserResponseDto> {
    try {
      const user = await this.userModel.create({
        ...input,
        email: this.normalizeEmail(input.email),
      });

      return this.toResponse(user);
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'An account with this email address already exists',
        );
      }

      throw error;
    }
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserWithPassword | null> {
    const user = await this.userModel
      .findOne({ email: this.normalizeEmail(email) })
      .select('+password')
      .exec();

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      password: user.password,
      role: user.role,
    };
  }

  async findPublicById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.userModel.findById(id).exec();

    return user ? this.toResponse(user) : null;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toResponse(user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private isDuplicateKeyError(error: unknown): error is { code: number } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
