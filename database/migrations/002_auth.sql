-- Phase 3 authentication sessions. Store only a SHA-256 digest of the random refresh token.
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL UNIQUE CHECK (refresh_token_hash ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  CHECK (expires_at > created_at),
  CHECK (rotated_at >= created_at),
  CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);
CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id);
CREATE INDEX auth_sessions_expiry_idx ON auth_sessions(expires_at);
