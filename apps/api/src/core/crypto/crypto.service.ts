// SPDX-License-Identifier: AGPL-3.0-or-later
import { createCipheriv, createDecipheriv, randomBytes, createHash, createHmac } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';

export interface KmsProvider {
  encrypt(text: string): string;
  decrypt(encryptedData: string): string;
  hash(data: string): string;
  hmac(data: string, key?: string): string;
}

@Injectable()
export class CryptoService implements KmsProvider {
  private readonly logger = new Logger(CryptoService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly keyVersion = 'v1';

  constructor() {
    const keyString = process.env.ENCRYPTION_KEY || this.generateKey();
    this.key = createHash('sha256').update(keyString).digest();

    if (!process.env.ENCRYPTION_KEY) {
      this.logger.warn(
        'ENCRYPTION_KEY not set in environment. Using generated key - data will not persist across restarts!'
      );
    }
  }

  encrypt(text: string): string {
    return this.encryptWithKey(text, this.key);
  }

  decrypt(encryptedData: string): string {
    // Handle both versioned (v1:iv:tag:ct) and legacy (iv:tag:ct) formats
    const parts = encryptedData.split(':');
    if (parts[0] === this.keyVersion) {
      // Versioned format: v1:iv:tag:ciphertext
      return this.decryptWithKey(encryptedData, this.key);
    }
    // Legacy format: iv:tag:ciphertext
    return this.decryptLegacy(encryptedData, this.key);
  }

  encryptWithKey(text: string, keyBuffer: Buffer): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, keyBuffer as any, new Uint8Array(iv));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${this.keyVersion}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decryptWithKey(encryptedData: string, keyBuffer: Buffer): string {
    const parts = encryptedData.split(':');
    let ivHex: string, authTagHex: string, encrypted: string;

    if (parts[0] === this.keyVersion) {
      [, ivHex, authTagHex, encrypted] = parts;
    } else {
      [ivHex, authTagHex, encrypted] = parts;
    }

    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(this.algorithm, keyBuffer as any, new Uint8Array(iv));
    decipher.setAuthTag(new Uint8Array(authTag));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  hash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  hmac(data: string, key?: string): string {
    const hmacKey = this.resolveHmacKey(key);
    return createHmac('sha256', hmacKey).update(data).digest('hex');
  }

  private resolveHmacKey(explicitKey?: string): string {
    if (explicitKey) return explicitKey;
    const auditKey = process.env.AUDIT_HMAC_KEY;
    if (auditKey) return auditKey;
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (encryptionKey) return encryptionKey;
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUDIT_HMAC_KEY or ENCRYPTION_KEY must be set in production');
    }
    return 'dev-only-hmac-key';
  }

  /**
   * Re-encrypt data from old key to new key.
   * Used during key rotation procedures.
   */
  rotateKey(encryptedData: string, oldKeyString: string, newKeyString: string): string {
    const oldKey = createHash('sha256').update(oldKeyString).digest();
    const newKey = createHash('sha256').update(newKeyString).digest();

    // Decrypt with old key (handle both formats)
    const parts = encryptedData.split(':');
    let plaintext: string;
    if (parts[0] === this.keyVersion) {
      plaintext = this.decryptWithKey(encryptedData, oldKey);
    } else {
      plaintext = this.decryptLegacy(encryptedData, oldKey);
    }

    // Re-encrypt with new key
    return this.encryptWithKey(plaintext, newKey);
  }

  private decryptLegacy(encryptedData: string, keyBuffer: Buffer): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(this.algorithm, keyBuffer as any, new Uint8Array(iv));
    decipher.setAuthTag(new Uint8Array(authTag));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private generateKey(): string {
    return randomBytes(32).toString('hex');
  }
}
