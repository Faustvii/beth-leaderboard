/*
 SQLite does not support "Drop default from column" out of the box, drizzle does
 not generate automatic migration for that, so it had to be done manually.

 The below migration statement is implemented following the "Modify column in table"
 paragraph from https://www.techonthenet.com/sqlite/tables/alter_table.php
*/

PRAGMA foreign_keys=off;--> statement-breakpoint

ALTER TABLE webhooks RENAME TO _webhooks_old;--> statement-breakpoint

CREATE TABLE webhooks (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	url text NOT NULL,
	secret text,
	event_type text NOT NULL,
	created_at integer NOT NULL,
	updated_at integer NOT NULL
);--> statement-breakpoint

INSERT INTO webhooks (id, url, secret, event_type, created_at, updated_at)
  SELECT id, url, secret, event_type, created_at, updated_at
  FROM _webhooks_old;--> statement-breakpoint

DROP TABLE _webhooks_old;--> statement-breakpoint

PRAGMA foreign_keys=on;
