CREATE TABLE `rating_event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer NOT NULL,
	`seasonId` integer NOT NULL,
	`playerId` integer NOT NULL,
	`data` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`seasonId`) REFERENCES `season`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`playerId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
/*
 SQLite does not support "Set default to column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
CREATE INDEX `season_id_idx` ON `rating_event` (`seasonId`);--> statement-breakpoint
CREATE INDEX `player_id_idx` ON `rating_event` (`playerId`);