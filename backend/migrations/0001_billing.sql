CREATE TABLE IF NOT EXISTS app_trials (
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  identity TEXT NOT NULL,
  credential_hash TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL CHECK (expires_at = started_at + 1209600000),
  PRIMARY KEY (environment, identity)
);
CREATE TABLE IF NOT EXISTS billing_events (
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  event_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_at INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  PRIMARY KEY (environment, event_id)
);
