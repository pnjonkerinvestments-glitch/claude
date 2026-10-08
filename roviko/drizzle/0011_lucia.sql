-- Lucia 👽 (1.30): Roviko's computer friend. Adds one account row; nothing existing changes.
-- No email and no password, so nobody can sign in as Lucia. Friend code CAFE1C1A.
INSERT OR IGNORE INTO `users` (`id`, `email`, `password`, `name`, `avatar`, `guest`, `discoverable`, `blocked`, `created_at`, `email_verified`) VALUES ('cafe1c1a-0000-4000-8000-000000000001', NULL, NULL, 'Lucia 👽', 3, 0, 1, 0, 1791460800000, 0);
