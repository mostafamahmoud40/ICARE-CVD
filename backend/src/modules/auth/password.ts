import * as argon2 from 'argon2';

export async function hashPassword(value: string): Promise<string> {
  return argon2.hash(value, { type: argon2.argon2id });
}
