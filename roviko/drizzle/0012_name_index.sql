-- 1.33: find accounts by username (capitals and surrounding spaces ignored). Adds one index; no data changes.
CREATE INDEX IF NOT EXISTS `users_name_key` ON `users` (lower(trim(`name`)));
