-- Pool (/all) lists by sort_at so stale-on-discovery backfills surface at discovery time
-- (aligned with homepage selected cards). timeline_at remains the archival source timestamp.
CREATE INDEX CONCURRENTLY IF NOT EXISTS publications_pool_sort_idx
  ON publications (sort_at DESC, article_id)
  WHERE visibility = 'public' AND eligible;
