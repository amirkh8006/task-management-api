import { Transform } from 'class-transformer';
import { IsByteLength, IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password with 8-72 UTF-8 bytes.',
    format: 'password',
    writeOnly: true,
  })
  @IsString()
  @IsByteLength(8, 72)
  password!: string;
}
