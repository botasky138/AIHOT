CREATE TABLE mafi_preference_reactions (
  device_id text NOT NULL REFERENCES mafi_preference_devices (device_id) ON DELETE CASCADE,
  article_id text NOT NULL,
  source_id text NOT NULL,
  vote text NULL CHECK (vote IS NULL OR vote IN ('up', 'down')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, article_id)
);
