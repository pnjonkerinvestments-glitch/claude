ALTER TABLE `answers` ADD `country_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `answers` ADD `mode` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `daily_game_unique` ON `game_sessions` (`user_id`,`date`,`kind`);