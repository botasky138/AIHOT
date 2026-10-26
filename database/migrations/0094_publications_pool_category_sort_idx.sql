CREATE INDEX CONCURRENTLY IF NOT EXISTS publications_pool_category_sort_idx
  ON publications (category, sort_at DESC, article_id DESC)
  INCLUDE (channel, source_id, selected, visible_after)
  WHERE visibility = 'public' AND eligible;
