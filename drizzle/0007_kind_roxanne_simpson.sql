CREATE TABLE `job_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `jq_created_at_idx` ON `job_queue` (`created_at`);--> statement-breakpoint
CREATE INDEX `jq_status_idx` ON `job_queue` (`status`);--> statement-breakpoint
CREATE INDEX `jq_type_idx` ON `job_queue` (`type`);