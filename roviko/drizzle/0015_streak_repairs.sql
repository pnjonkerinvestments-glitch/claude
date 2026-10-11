-- 1.39: free streak repairs (once per 30 days). Adds one new table; no data changes.
CREATE TABLE IF NOT EXISTS `streak_repairs` (`user_id` text NOT NULL, `date` text NOT NULL, `created_at` integer NOT NULL, PRIMARY KEY(`user_id`, `date`));
