CREATE TABLE `webhooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`secret` text,
	`event_type` text NOT NULL,
	`created_at` integer DEFAULT 1732896552115 NOT NULL,
	`updated_at` integer DEFAULT 1732896552115 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `url` ON `webhooks` (`url`);