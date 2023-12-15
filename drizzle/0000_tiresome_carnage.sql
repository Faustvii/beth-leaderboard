CREATE TABLE `job_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
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
	`result` text NOT NULL,
	`score_diff` integer NOT NULL,
	`white_elo_change` integer NOT NULL,
	`black_elo_change` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`white_player_one`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`white_player_two`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`black_player_one`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`black_player_two`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
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
CREATE INDEX `jq_created_at_idx` ON `job_queue` (`created_at`);--> statement-breakpoint
CREATE INDEX `jq_status_idx` ON `job_queue` (`status`);--> statement-breakpoint
CREATE INDEX `jq_type_idx` ON `job_queue` (`type`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `match` (`createdAt`);--> statement-breakpoint
CREATE INDEX `players_idx` ON `match` (`black_player_one`,`white_player_one`,`black_player_two`,`white_player_two`);--> statement-breakpoint
CREATE INDEX `elo_idx` ON `user` (`elo`);