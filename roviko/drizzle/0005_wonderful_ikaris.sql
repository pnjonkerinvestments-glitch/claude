PRAGMA defer_foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_daily_scores` (
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
	CONSTRAINT "daily_score_bounds" CHECK("__new_daily_scores"."score" BETWEEN 0 AND 1000),
	CONSTRAINT "daily_score_modes" CHECK("__new_daily_scores"."mode" IN ('daily','trail','compare','mosaic','rank','duel'))
);
--> statement-breakpoint
INSERT INTO `__new_daily_scores`("user_id", "date", "mode", "session_id", "score", "scoring_version", "created_at") SELECT "user_id", "date", "mode", "session_id", "score", "scoring_version", "created_at" FROM `daily_scores`;--> statement-breakpoint
DROP TABLE `daily_scores`;--> statement-breakpoint
ALTER TABLE `__new_daily_scores` RENAME TO `daily_scores`;--> statement-breakpoint
PRAGMA defer_foreign_keys=OFF;--> statement-breakpoint
CREATE UNIQUE INDEX `daily_score_session` ON `daily_scores` (`session_id`);--> statement-breakpoint
CREATE INDEX `daily_scores_ranking` ON `daily_scores` (`date`,`mode`,`score`);