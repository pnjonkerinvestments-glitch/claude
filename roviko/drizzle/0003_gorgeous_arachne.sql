CREATE TABLE `daily_scores` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`mode` text NOT NULL,
	`session_id` text NOT NULL,
	`score` integer NOT NULL,
	`scoring_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `date`, `mode`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "daily_score_bounds" CHECK("daily_scores"."score" BETWEEN 0 AND 1000),
	CONSTRAINT "daily_score_modes" CHECK("daily_scores"."mode" IN ('daily','trail','compare','mosaic','rank'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_score_session` ON `daily_scores` (`session_id`);--> statement-breakpoint
CREATE INDEX `daily_scores_ranking` ON `daily_scores` (`date`,`mode`,`score`);