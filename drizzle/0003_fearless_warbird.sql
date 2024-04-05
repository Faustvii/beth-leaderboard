DROP INDEX IF EXISTS `elo_idx`;--> statement-breakpoint
ALTER TABLE `match` DROP COLUMN `white_elo_change`;--> statement-breakpoint
ALTER TABLE `match` DROP COLUMN `black_elo_change`;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `elo`;