// SPDX-License-Identifier: AGPL-3.0-or-later
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  }
);

export interface AuthenticatedUser {
  id: string;
  userId: string; // Backwards compatibility alias for id
  email: string;
  name: string;
  locale: string;
  timezone: string;
  totpEnabled: boolean;
  isAdmin?: boolean;
}