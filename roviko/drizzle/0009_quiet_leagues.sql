CREATE TABLE `league_members` (
	`week` text NOT NULL,
	`user_id` text NOT NULL,
	`tier` integer NOT NULL,
	`group_no` integer NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`week`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `league_group` ON `league_members` (`week`,`tier`,`group_no`);--> statement-breakpoint
CREATE INDEX `league_user` ON `league_members` (`user_id`,`week`);