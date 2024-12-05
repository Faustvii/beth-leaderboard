CREATE TABLE `quest` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer NOT NULL,
	`playerId` text NOT NULL,
	`conditionData` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`playerId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rating_event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer NOT NULL,
	`seasonId` integer NOT NULL,
	`playerId` text NOT NULL,
	`data` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`seasonId`) REFERENCES `season`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`playerId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quest_player_id_idx` ON `quest` (`playerId`);--> statement-breakpoint
CREATE INDEX `event_season_id_idx` ON `rating_event` (`seasonId`);--> statement-breakpoint
CREATE INDEX `event_player_id_idx` ON `rating_event` (`playerId`);