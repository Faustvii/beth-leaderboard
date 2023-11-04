ALTER TABLE tournaments ADD `mode` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tournament_matches` DROP COLUMN `mode`;