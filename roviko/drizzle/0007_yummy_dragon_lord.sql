CREATE TABLE `email_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `email_tokens_user` ON `email_tokens` (`user_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` integer DEFAULT 0 NOT NULL;