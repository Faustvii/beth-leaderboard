CREATE TABLE `season` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`startAt` integer NOT NULL,
	`endAt` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE match ADD `seasonId` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `season_name_unique` ON `season` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `season_period_idx` ON `season` (`startAt`,`endAt`);