CREATE INDEX CONCURRENTLY IF NOT EXISTS publications_pool_channel_sort_idx
  ON publications (channel, sort_at DESC, article_id DESC)
  INCLUDE (category, source_id, selected, visible_after)
  WHERE visibility = 'public' AND eligible;
