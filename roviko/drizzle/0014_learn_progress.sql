-- 1.38: Learn progress per account (one JSON map of cards per player). Adds one new table; no data changes.
CREATE TABLE IF NOT EXISTS `learn_progress` (`user_id` text PRIMARY KEY NOT NULL, `data` text NOT NULL, `updated_at` integer NOT NULL);
