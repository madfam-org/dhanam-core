// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT authentication guard.
 *
 * dhanam-core uses local HS256 JWTs issued by the API itself. (The full product
 * additionally supports external OIDC RS256 tokens; that path is not part of the open
 * core.)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(
    err: Error | null,
    user: Record<string, unknown> | false,
    info: { message?: string } | undefined,
    context: ExecutionContext
  ) {
    if (err || !user) {
      this.logger.warn(
        `Authentication failed: ${err?.message || info?.message || 'Unknown error'}`
      );
    }
    return super.handleRequest(err, user, info, context);
  }
}
