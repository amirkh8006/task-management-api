import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { apiErrorExample } from '../common/swagger/api-error-example';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a user and receive an access token' })
  @ApiCreatedResponse({
    description: 'The user was registered successfully.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The registration data is invalid.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      400,
      'Bad Request',
      ['password must be longer than or equal to 8 bytes'],
      '/auth/register',
    ),
  })
  @ApiConflictResponse({
    description: 'An account with this email address already exists.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      409,
      'Conflict',
      'An account with this email address already exists',
      '/auth/register',
    ),
  })
  register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiOkResponse({
    description: 'The credentials are valid.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The login data is invalid.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      400,
      'Bad Request',
      ['email must be an email'],
      '/auth/login',
    ),
  })
  @ApiUnauthorizedResponse({
    description: 'The email or password is invalid.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(
      401,
      'Unauthorized',
      'Invalid email or password',
      '/auth/login',
    ),
  })
  login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the authenticated user' })
  @ApiOkResponse({
    description: 'The current authenticated user.',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing, invalid, or expired.',
    type: ApiErrorResponseDto,
    example: apiErrorExample(401, 'Unauthorized', 'Unauthorized', '/auth/me'),
  })
  getCurrentUser(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): AuthenticatedUser {
    return currentUser;
  }
}
