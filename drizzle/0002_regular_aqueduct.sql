CREATE TABLE `new_match` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `white_player_one` text NOT NULL,
    `white_player_two` text,
    `black_player_one` text NOT NULL,
    `black_player_two` text,
    "result" text NOT NULL,
    `score_diff` integer NOT NULL,
    `createdAt` integer NOT NULL,
    "white_elo_change" integer NOT NULL,
    `black_elo_change` integer NOT NULL,
    `seasonId` integer NOT NULL REFERENCES season(id)
)--> statement-breakpoint

insert into "season" ("id", "name", "startAt", "endAt") values (null, "Season 1", 1672527600, 1704063600) --> statement-breakpoint

INSERT INTO new_match (
        white_player_one,
        white_player_two,
        black_player_one,
        black_player_two,
        result,
        score_diff,
        createdAt,
        white_elo_change,
        black_elo_change,
        seasonId
    )
SELECT white_player_one,
    white_player_two,
    black_player_one,
    black_player_two,
    result,
    score_diff,
    createdAt,
    white_elo_change,
    black_elo_change,
    seasonId
FROM match;--> statement-breakpoint

ALTER TABLE match RENAME TO old_match;--> statement-breakpoint
ALTER TABLE new_match RENAME TO match;--> statement-breakpoint

DROP TABLE old_match;
CREATE INDEX `match_seasons_idx` ON `match` (`seasonId`);
