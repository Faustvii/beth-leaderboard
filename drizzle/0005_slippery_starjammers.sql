ALTER TABLE `match` RENAME COLUMN `elo_change` TO `white_elo_change`;--> statement-breakpoint
ALTER TABLE match ADD `black_elo_change` integer DEFAULT 0 NOT NULL;