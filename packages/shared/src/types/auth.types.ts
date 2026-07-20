import { UUID } from './common.types';
import { UserProfile } from './user.types';

export interface LoginDto {
  email: string;
  password: string;
  totpCode?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  locale?: string;
  timezone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface JwtPayload {
  sub: UUID;
  email: string;
  spaces: Array<{
    id: UUID;
    role: string;
  }>;
  iat: number;
  exp: number;
  jti: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
}

export interface VerifyTwoFactorDto {
  code: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}
