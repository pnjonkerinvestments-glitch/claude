-- 1.55: Daily Crossroads. How often each country was the right answer in each square of a day's grid, for "31% picked this"
-- and "rare pick". Only a count per date, square and country: no player is stored. Adds one table; no data changes.
CREATE TABLE `crossroads_picks` (
	`date` text NOT NULL,
	`cell` integer NOT NULL,
	`country_id` text NOT NULL,
	`picks` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`date`, `cell`, `country_id`)
);
