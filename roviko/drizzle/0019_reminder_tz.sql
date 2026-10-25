-- 1.52: the player's time zone for the reminder email, so it arrives in the daytime where the player lives (17:00 local
-- time) instead of 17:00 UTC for everyone. Adds one column; no data changes.
ALTER TABLE `email_reminders` ADD `tz` text;
