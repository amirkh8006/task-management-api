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
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AdminService } from './admin.service';

const userIdParameter = {
  name: 'id',
  description: 'MongoDB ObjectId of a user.',
  example: '66bf30f125f21465bfc93d57',
};

@ApiTags('Admin - Users')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  description: 'The access token is missing, invalid, or expired.',
})
@ApiForbiddenResponse({
  description: 'The authenticated user does not have the admin role.',
})
@Roles(UserRole.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class AdminUsersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiOkResponse({
    description: 'All users, with password fields excluded.',
    type: UserResponseDto,
    isArray: true,
  })
  findAll(): Promise<UserResponseDto[]> {
    return this.adminService.findAllUsers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID (admin only)' })
  @ApiParam(userIdParameter)
  @ApiOkResponse({
    description: 'The requested user, with the password field excluded.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'The user ID is malformed.' })
  @ApiNotFoundResponse({ description: 'The user does not exist.' })
  findOne(@Param('id') userId: string): Promise<UserResponseDto> {
    return this.adminService.findUser(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a user and all tasks owned by that user (admin only)',
  })
  @ApiParam(userIdParameter)
  @ApiNoContentResponse({
    description: 'The user and all tasks owned by that user were deleted.',
  })
  @ApiBadRequestResponse({ description: 'The user ID is malformed.' })
  @ApiNotFoundResponse({ description: 'The user does not exist.' })
  delete(@Param('id') userId: string): Promise<void> {
    return this.adminService.deleteUser(userId);
  }
}
