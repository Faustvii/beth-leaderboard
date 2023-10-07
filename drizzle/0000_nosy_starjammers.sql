CREATE TABLE `user_key` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`hashed_password` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `match` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`white_player_one` text NOT NULL,
	`white_player_two` text,
	`black_player_one` text NOT NULL,
	`black_player_two` text,
	`content` text NOT NULL,
	`score_diff` integer NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`active_expires` blob NOT NULL,
	`idle_expires` blob NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`picture` text NOT NULL,
	`elo` integer DEFAULT 1500 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `match` (`createdAt`);--> statement-breakpoint
CREATE INDEX `elo_idx` ON `user` (`elo`);