import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserRole } from '../common/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

const PASSWORD_HASH_ROUNDS = 12;
const INVALID_CREDENTIALS_HASH =
  '$2b$12$AdIZ.NMueJ0QlVzOveOg3OTZeLZK60Qx9.7l5X/pZDG8wIEMi8X66';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const passwordHash = await bcrypt.hash(
      registerDto.password,
      PASSWORD_HASH_ROUNDS,
    );
    const user = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      password: passwordHash,
      role: UserRole.User,
    });

    return this.issueAccessToken(user.id, user.role);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );
    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user?.password ?? INVALID_CREDENTIALS_HASH,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueAccessToken(user.id, user.role);
  }

  private async issueAccessToken(
    userId: string,
    role: UserRole,
  ): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: userId, role };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
