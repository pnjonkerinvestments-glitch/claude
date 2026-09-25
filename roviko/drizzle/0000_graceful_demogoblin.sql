CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`definition` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `answers` (
	`session_id` text NOT NULL,
	`round` integer NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`answer` text NOT NULL,
	`correct` integer NOT NULL,
	`points` integer NOT NULL,
	`response_time` integer NOT NULL,
	`risk` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `round`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `answer_user` ON `answers` (`user_id`);--> statement-breakpoint
CREATE TABLE `country_borders` (
	`country_id` text NOT NULL,
	`neighbor_id` text NOT NULL,
	PRIMARY KEY(`country_id`, `neighbor_id`),
	FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`neighbor_id`) REFERENCES `countries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `concept_performance` (
	`user_id` text NOT NULL,
	`country_id` text NOT NULL,
	`mode` text NOT NULL,
	`correct` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `country_id`, `mode`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` text PRIMARY KEY NOT NULL,
	`iso2` text NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`source_id` text,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `iso2_unique` ON `countries` (`iso2`);--> statement-breakpoint
CREATE TABLE `daily_challenge_results` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`result_id` text NOT NULL,
	`score` integer NOT NULL,
	PRIMARY KEY(`user_id`, `date`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`result_id`) REFERENCES `game_results`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `daily_ranking` ON `daily_challenge_results` (`date`,`score`);--> statement-breakpoint
CREATE TABLE `disabled_questions` (
	`question_id` text PRIMARY KEY NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`user_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`earned_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `achievement_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`mode` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `friend_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`from_id` text NOT NULL,
	`to_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`from_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friend_pair` ON `friend_requests` (`from_id`,`to_id`);--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`date` text,
	`state` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `games_user_time` ON `game_sessions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `matchmaking_queue` (
	`user_id` text PRIMARY KEY NOT NULL,
	`region` text NOT NULL,
	`rating` real NOT NULL,
	`queued_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`rating` real DEFAULT 1000 NOT NULL,
	`games` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `question_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`question_id` text NOT NULL,
	`template` text NOT NULL,
	`category` text NOT NULL,
	`detail` text,
	`app_version` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `game_results` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`score` integer NOT NULL,
	`xp` integer NOT NULL,
	`correct` integer NOT NULL,
	`total` integer NOT NULL,
	`duration` integer NOT NULL,
	`best_streak` integer NOT NULL,
	`win` integer DEFAULT 0 NOT NULL,
	`multiplayer` integer DEFAULT 0 NOT NULL,
	`risk` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `results_leaderboard` ON `game_results` (`created_at`,`score`);--> statement-breakpoint
CREATE INDEX `results_user` ON `game_results` (`user_id`);--> statement-breakpoint
CREATE TABLE `multiplayer_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `auth_user` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`license` text NOT NULL,
	`imported_at` text NOT NULL,
	`attribution` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`password` text,
	`name` text NOT NULL,
	`avatar` integer DEFAULT 0 NOT NULL,
	`guest` integer DEFAULT 1 NOT NULL,
	`discoverable` integer DEFAULT 1 NOT NULL,
	`blocked` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_unique` ON `users` (`email`);