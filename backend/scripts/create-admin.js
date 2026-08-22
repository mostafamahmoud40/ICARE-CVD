const { Client } = require('pg');
const argon2 = require('argon2');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/icare_cvd';
  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const email = process.env.ADMIN_EMAIL || 'admin@icare.com';
    const name = process.env.ADMIN_NAME || 'System Admin';
    const rawPassword = process.env.ADMIN_INITIAL_PASSWORD || 'AdminSecretPassword2026!';
    
    // Hash password using argon2id matching password.ts logic
    const passwordHash = await argon2.hash(rawPassword, { type: argon2.argon2id });

    // Check if user already exists
    const checkRes = await client.query('SELECT id FROM "user" WHERE email = $1', [email]);
    
    if (checkRes.rows.length > 0) {
      // Update existing user to admin with new password
      await client.query(
        'UPDATE "user" SET name = $1, role = $2, password = $3, is_active = true WHERE email = $4',
        [name, 'admin', passwordHash, email]
      );
      console.log(`User ${email} already existed. Updated to ADMIN with the new password.`);
    } else {
      // Insert new admin user
      await client.query(
        'INSERT INTO "user" (name, email, role, password, is_active) VALUES ($1, $2, $3, $4, true)',
        [name, email, 'admin', passwordHash]
      );
      console.log(`Successfully created new ADMIN user.`);
    }

    console.log('\n----------------------------------------');
    console.log(`Email/Username: ${email}`);
    console.log(`Password: ${rawPassword}`);
    console.log('----------------------------------------\n');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
