-- 1.51: the optional daily reminder by email for website players with a confirmed address. Only for players who turn
-- it on themselves; at most one mail a day. `email_reminders` keeps the choice, the language and the last day a mail
-- went out (rows go with the account); `email_reminder_log` keeps only a count per day for /admin. Adds two new
-- tables; no data changes.
CREATE TABLE IF NOT EXISTS `email_reminders` (`user_id` text PRIMARY KEY NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE, `enabled` integer DEFAULT 0 NOT NULL, `locale` text DEFAULT 'en' NOT NULL, `last_sent` text, `updated_at` integer NOT NULL);
CREATE TABLE IF NOT EXISTS `email_reminder_log` (`day` text PRIMARY KEY NOT NULL, `sent` integer DEFAULT 0 NOT NULL);
