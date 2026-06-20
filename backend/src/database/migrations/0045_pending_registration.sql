-- Pending sign-ups: user row is created only after email OTP is verified.
CREATE TABLE IF NOT EXISTS pending_registration (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  phone text,
  password text NOT NULL,
  otp_code text NOT NULL,
  otp_expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pending_registration_email_idx ON pending_registration (email);
