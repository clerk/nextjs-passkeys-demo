-- Drop existing tables if they exist
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS credentials CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Credentials table (stores passkey public keys and metadata)
CREATE TABLE credentials (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    sign_count INTEGER NOT NULL DEFAULT 0,
    transports TEXT[] NULL,
    aaguid TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Challenges table (temporary storage for registration/authentication challenges)
CREATE TABLE challenges (
    id BIGSERIAL PRIMARY KEY,
    challenge TEXT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_challenges_user_type ON challenges (user_id, type);
CREATE INDEX idx_credentials_user ON credentials (user_id);
CREATE INDEX idx_credentials_credential_id ON credentials (credential_id);
