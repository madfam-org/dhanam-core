import { UUID, Currency } from './common.types';
import { SpaceRole } from './user.types';

export interface Space {
  id: UUID;
  name: string;
  type: SpaceType;
  currency: Currency;
  role?: SpaceRole;
  createdAt: string;
  updatedAt: string;
}

export type SpaceType = 'personal' | 'business';

export interface CreateSpaceDto {
  name: string;
  type: SpaceType;
  currency?: Currency;
}

export interface UpdateSpaceDto {
  name?: string;
  currency?: Currency;
}

export interface SpaceMember {
  userId: UUID;
  email: string;
  name: string;
  role: SpaceRole;
  joinedAt: string;
}

export interface InviteSpaceMemberDto {
  email: string;
  role: SpaceRole;
}

export interface UpdateSpaceMemberRoleDto {
  role: SpaceRole;
}
