#!/usr/bin/env node

import 'dotenv/config';

import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { user as userTable } from './dist/src/database/schema/users.schema.js';
import * as argon2 from 'argon2';

const ADMIN_EMAIL = 'admin@icare-cvd.local';
const ADMIN_NAME = 'System Admin';
const ADMIN_PHONE = '+000000000000';
const ADMIN_PASSWORD = 'Admin123456';

async function createAdminAccount() {
  console.log('Creating admin account...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const db = drizzle(client);

    const existing = await db.select().from(userTable).where(eq(userTable.email, ADMIN_EMAIL)).limit(1);

    console.log('Existing accounts:', existing);
    console.log('Existing count:', existing.length);

    let passwordHash;
    if (existing.length > 0) {
      console.log('Admin account already exists with email:', ADMIN_EMAIL);
      passwordHash = existing[0].password;
      
      const accessToken = Buffer.from(`${ADMIN_EMAIL}:${Date.now()}`).toString('base64');
      const accessTokenHash = await argon2.hash(accessToken, { type: argon2.argon2id });
      const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const refreshToken = Buffer.from(`${ADMIN_EMAIL}:${Date.now()}:refresh`).toString('base64');
      const refreshTokenHash = await argon2.hash(refreshToken, { type: argon2.argon2id });
      const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      console.log('Updating existing admin account...');
      const result = await db.update(userTable).set({
        accessTokenHash,
        accessTokenExpiresAt,
        refreshTokenHash,
        refreshTokenExpiresAt,
      }).where(eq(userTable.email, ADMIN_EMAIL));

      console.log('Update completed. Rows affected:', result.rowCount);
    } else {
      passwordHash = await argon2.hash(ADMIN_PASSWORD, { type: argon2.argon2id });
      console.log('Creating new admin account...');
      
      const accessToken = Buffer.from(`${ADMIN_EMAIL}:${Date.now()}`).toString('base64');
      const accessTokenHash = await argon2.hash(accessToken, { type: argon2.argon2id });
      const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const refreshToken = Buffer.from(`${ADMIN_EMAIL}:${Date.now()}:refresh`).toString('base64');
      const refreshTokenHash = await argon2.hash(refreshToken, { type: argon2.argon2id });
      const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      console.log('Inserting new admin account...');
      const result = await db.insert(userTable).values({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        phone: ADMIN_PHONE,
        password: passwordHash,
        accessTokenHash,
        accessTokenExpiresAt,
        refreshTokenHash,
        refreshTokenExpiresAt,
        role: 'admin',
        isActive: true,
      });

      console.log('Insert completed. Rows affected:', result.rowCount);
    }
    console.log('────────────────────────────────────────');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('────────────────────────────────────────');

    await client.end();
    console.log('Disconnected from database');
  } catch (error) {
    console.error('Error creating admin account:', error);
    await client.end();
    process.exit(1);
  }
}

createAdminAccount();
