import type { UserRole } from '../../common/enums/user-role.enum';

export interface UserWithPassword {
  id: string;
  password: string;
  role: UserRole;
}
