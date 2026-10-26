CREATE TABLE mafi_preference_devices (
  device_id text PRIMARY KEY,
  user_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
