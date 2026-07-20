// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomBytes } from 'crypto';

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service';

import { SessionService } from './session.service';

/**
 * Guest access — creates a throwaway, read-mostly account so a visitor can try
 * the app without registering.
 *
 * The open core provisions a guest with a fresh, empty personal space to
 * explore; it ships no sample or demo dataset.
 */
@Injectable()
export class GuestAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private sessionService: SessionService
  ) {}

  async createGuestSession(countryCode?: string): Promise<{
    user: { id: string; email: string; name: string | null };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const suffix = randomBytes(8).toString('hex');
    const email = `guest-${suffix}@guest.local`;
    const currency = countryCode?.toUpperCase() === 'MX' ? 'MXN' : 'USD';

    const user = await this.prisma.user.create({
      data: {
        email,
        // Guests never sign in with a password; store an unusable random value.
        passwordHash: `guest:${randomBytes(24).toString('hex')}`,
        name: 'Guest',
        emailVerified: false,
        userSpaces: {
          create: {
            role: 'owner',
            space: {
              create: {
                name: 'My Space',
                type: 'personal',
                currency,
              },
            },
          },
        },
      },
      select: { id: true, email: true, name: true },
    });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      isGuest: true,
    });
    const refreshToken = await this.sessionService.createRefreshToken(user.id, user.email);

    return {
      user,
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
    };
  }

  /**
   * Validate if a JWT token is for a guest session
   */
  async isGuestSession(token: string): Promise<boolean> {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded.isGuest === true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup expired guest sessions
   */
  async cleanupExpiredGuestSessions(): Promise<void> {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await this.prisma.auditLog.deleteMany({
      where: {
        action: 'guest.session_created',
        createdAt: {
          lt: twoDaysAgo,
        },
      },
    });
  }
}
