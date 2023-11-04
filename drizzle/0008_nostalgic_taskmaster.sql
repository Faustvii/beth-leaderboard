CREATE TABLE `tournaments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`active` integer NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tournament_matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tournament_id` integer,
	`team_one` text NOT NULL,
	`team_two` text NOT NULL,
	`result` text NOT NULL,
	`mode` text NOT NULL,
	`score_diff` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_one`) REFERENCES `tournament_teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_two`) REFERENCES `tournament_teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tournament_team_members` (
	`user_id` text,
	`team_id` integer,
	PRIMARY KEY(`team_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `tournament_teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tournament_teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tournament_id` integer,
	`team_name` text NOT NULL,
	`team_elo` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tournament_created_at_idx` ON `tournaments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `tournament_match_created_at_idx` ON `tournament_matches` (`createdAt`);--> statement-breakpoint
CREATE INDEX `tournament_teams_created_at_idx` ON `tournament_teams` (`createdAt`);