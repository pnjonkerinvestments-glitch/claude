CREATE TABLE `daily_content` (
	`date` text NOT NULL,
	`kind` text NOT NULL,
	`dataset_version` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`date`, `kind`)
);
--> statement-breakpoint
CREATE TABLE `learning_reviews` (
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`country_id` text NOT NULL,
	`mode` text NOT NULL,
	`topic` text,
	`content` text NOT NULL,
	`missed` integer DEFAULT 1 NOT NULL,
	`resolved` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reviews_user_resolved` ON `learning_reviews` (`user_id`,`resolved`,`updated_at`);