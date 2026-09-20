import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../common/enums/user-role.enum';

export class UserResponseDto {
  @ApiProperty({ example: '66bf312225f21465bfc93d5c' })
  id!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.User })
  role!: UserRole;

  @ApiProperty({ example: '2026-09-20T07:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-20T07:00:00.000Z' })
  updatedAt!: Date;
}
