CREATE TABLE `answers` (
	`id` integer PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`answer` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ice_candidates` (
	`id` integer PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`candidate` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` integer PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`offer` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
