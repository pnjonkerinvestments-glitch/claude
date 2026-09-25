CREATE TABLE `player_blocks` (
	`blocker_id` text NOT NULL,
	`blocked_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`blocker_id`, `blocked_id`),
	FOREIGN KEY (`blocker_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`blocked_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `player_blocks_blocked` ON `player_blocks` (`blocked_id`);--> statement-breakpoint
CREATE TABLE `player_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text,
	`reported_id` text NOT NULL,
	`reported_name` text NOT NULL,
	`reason` text NOT NULL,
	`room_code` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `player_reports_status` ON `player_reports` (`status`,`created_at`);