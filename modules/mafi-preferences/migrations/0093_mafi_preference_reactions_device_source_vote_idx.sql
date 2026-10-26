CREATE INDEX CONCURRENTLY IF NOT EXISTS mafi_preference_reactions_device_source_vote_idx
  ON mafi_preference_reactions (device_id, source_id)
  WHERE vote IS NOT NULL;
