import { z } from 'zod';

export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8);
export const uuidSchema = z.string().uuid();

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}
