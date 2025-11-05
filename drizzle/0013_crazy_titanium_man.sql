DROP INDEX IF EXISTS `url`;--> statement-breakpoint
ALTER TABLE `webhooks` ADD `active` integer DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `url_event_type_idx` ON `webhooks` (`url`,`event_type`);