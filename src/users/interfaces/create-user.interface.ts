import type { UserRole } from '../../common/enums/user-role.enum';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}
