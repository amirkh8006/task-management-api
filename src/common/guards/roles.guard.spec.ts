import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { UserRole } from '../enums/user-role.enum';
import { RolesGuard } from './roles.guard';

function executionContext(
  user?: Pick<AuthenticatedUser, 'role'>,
): ExecutionContext {
  return {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows routes that do not declare role requirements', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(executionContext())).toBe(true);
  });

  it('allows an authenticated user with a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.Admin]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(executionContext({ role: UserRole.Admin }))).toBe(
      true,
    );
  });

  it('rejects missing users and users without a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.Admin]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(executionContext())).toBe(false);
    expect(guard.canActivate(executionContext({ role: UserRole.User }))).toBe(
      false,
    );
  });
});
