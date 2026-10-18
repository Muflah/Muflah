CREATE TABLE IF NOT EXISTS username_aliases (
  user_id TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, username),
  CONSTRAINT username_aliases_username_unique UNIQUE (username)
);

CREATE INDEX IF NOT EXISTS username_aliases_user_id_idx ON username_aliases (user_id);
