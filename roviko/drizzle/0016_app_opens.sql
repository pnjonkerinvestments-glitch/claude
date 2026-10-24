-- 1.49: which kind of device a player opens Roviko on per day (web, the iPhone app, the Android app), for the growth
-- dashboard on /admin. Adds one new table and one index; no data changes. Rows go with the account (ON DELETE CASCADE).
CREATE TABLE IF NOT EXISTS `app_opens` (`day` text NOT NULL, `platform` text NOT NULL, `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE, PRIMARY KEY(`day`, `platform`, `user_id`));
CREATE INDEX IF NOT EXISTS `answers_created` ON `answers` (`created_at`);
