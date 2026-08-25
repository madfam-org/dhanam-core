// SPDX-License-Identifier: AGPL-3.0-or-later
import { AuthenticatedUser } from '@core/auth/decorators/current-user.decorator';

/**
 * Request object with the authenticated user attached by JwtAuthGuard.
 *
 * Use this instead of `any` for `@Req()` / `@Request()` parameters in controllers:
 *
 * ```ts
 * import { AuthenticatedRequest } from '@core/types/authenticated-request';
 *
 * @Get()
 * async list(@Req() req: AuthenticatedRequest) {
 *   const userId = req.user.id;
 * }
 * ```
 */
export interface AuthenticatedRequest {
  user: AuthenticatedUser;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}
