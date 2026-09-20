import type { UserRole } from '../../common/enums/user-role.enum';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
