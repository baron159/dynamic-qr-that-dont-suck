import { z } from 'zod';
import { randomBytes } from '@noble/hashes/utils.js';
import { bytesToHex as toHex } from '@noble/hashes/utils.js';
import { scrypt } from '@noble/hashes/scrypt.js';
import toUint8 from 'hex-to-uint8';

// We moved to v4 of zod, which deprecates the superRefine method.
// So FIXME to used the new `check` method
export const PasswordValidator = z
.string()
.min(8, { message: 'Password must be at least 8 characters long' })
.superRefine((password, ctx) => {
  if (!/[a-z]/.test(password)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Password must contain at least one lowercase letter',
    });
  }
  if (!/[A-Z]/.test(password)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Password must contain at least one uppercase letter',
    });
  }
  if (!/\d/.test(password)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Password must contain at least one number',
    });
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Password must contain at least one special character',
    });
  }
});

export const PasswordSchema = z.string().transform((str, ctx) => {
  const [salt, passwordHash] = str.split(';;;;');
  
  if (!salt || !passwordHash) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid format. Expected "<salt>;;;;<passwordHash>"',
    });
    return z.NEVER;
  }

  return { salt, passwordHash };
});

export const PasswordStringSchema = z.object({
  salt: z.string(),
  passwordHash: z.string(),
}).transform((data) => `${data.salt};;;;${data.passwordHash}`);

export type PasswordData = z.infer<typeof PasswordSchema>;
export type PasswordString = z.infer<typeof PasswordStringSchema>;

/**
 * Hashes password using scrypt
 * @param password - The string password to hash
 * @returns a ready-to-store password hash string, which holds the salt and the hash
 */
export function newPasswordHash(password: string): PasswordString {
  const salt = randomBytes(16);
  const h = toHex(scrypt(password, salt, { N: 2 ** 16, r: 8, p: 1 }));
  return PasswordStringSchema.parse({ salt: toHex(salt), passwordHash: h });
}

/**
 * Verifies a password against a stored hash
 * @param password - The string password to verify
 * @param storedHash - The stored password hash string
 * @returns true if the password is correct, false otherwise
 */
export function verifyPassword(password: string, storedHash: PasswordString): boolean {
  const { salt, passwordHash } = PasswordSchema.parse(storedHash);
  const saltBytes = toUint8(salt);
  const h = toHex(scrypt(password, saltBytes, { N: 2 ** 16, r: 8, p: 1 }));
  return h === passwordHash;
}

// export type MagicToken = string;
// export type MagicHash = string;

// export async function generateMagicToken(): Promise<[MagicToken, MagicHash]> {
//   const b64u = await import('base64-url');
//   const token:MagicToken = b64u.encode(toHex(randomBytes(32))); // 64 chars long (?)
  
//   const hash:MagicHash = await hashMagicToken(token)
//   return [token, hash];
// }

// export async function hashMagicToken(token: MagicToken): Promise<MagicHash> {
//   const { sha256 } = await import('@noble/hashes/sha2.js');
//   return toHex(sha256(token));
// }

// Test code
// console.log('trying the hash password function');
// const rtn = newPasswordHash('hunter2');
// console.log('rtn', rtn);

// console.log('trying the verify password function');
// const rtn2 = verifyPassword('hunter3', rtn);
// console.log('rtn2', rtn2);

// const [token, hash] = await generateMagicToken();
// console.log('token', token);
// console.log('hash', hash);
/* 
token NDI3Y2RkMjk4M2FhOTliYzBkYTIwMzFjZWVmNzliNDU4ZTgxNmIwMmE4NTcyNWYyNmQ2MGU2NDFlN2M2MDdmYw
hash 9d30102982bf2fcef08e51e92c41a29ed98df0424e22e0f5e01569004b1aafee
*/