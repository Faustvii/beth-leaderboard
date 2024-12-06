ALTER TABLE `quest` ADD `resolvedAt` integer;--> statement-breakpoint
ALTER TABLE `rating_event` ADD `matchId` integer REFERENCES match(id);
