-- 1.50: Lucia 👽 is every account's friend from the start and invites a player at most once a day, 30 seconds
-- after they come online; after two invites in a row without a yes she stops for good. This table remembers that
-- per player. Adds one new table; no data changes. Rows go with the account (ON DELETE CASCADE).
CREATE TABLE IF NOT EXISTS `lucia_friends` (`user_id` text PRIMARY KEY NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE, `added_at` integer NOT NULL, `online_since` integer, `last_day` text, `last_invite` text, `noes` integer DEFAULT 0 NOT NULL, `stopped` integer DEFAULT 0 NOT NULL);
