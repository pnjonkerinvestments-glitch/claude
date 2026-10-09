-- 1.34: faster per-player reads. Adds two indexes; no data changes.
CREATE INDEX IF NOT EXISTS `daily_scores_user_date` ON `daily_scores` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `friend_requests_to` ON `friend_requests` (`to_id`,`status`);
