import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { injectable } from 'inversify';
import { PasswordHasher } from 'restaurant-core';

const keyLength = 64;
const saltLength = 16;

function deriveKey(plainPassword: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(plainPassword, salt, keyLength, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

@injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    const salt = randomBytes(saltLength).toString('hex');
    const derivedKey = await deriveKey(plainPassword, salt);

    return `${salt}:${derivedKey.toString('hex')}`;
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    const [salt, expectedHex] = passwordHash.split(':');

    if (!salt || !expectedHex) {
      return false;
    }

    const actualKey = await deriveKey(plainPassword, salt);
    const expectedKey = Buffer.from(expectedHex, 'hex');

    if (expectedKey.length !== actualKey.length) {
      return false;
    }

    return timingSafeEqual(actualKey, expectedKey);
  }
}
