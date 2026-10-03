CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`stage` text NOT NULL,
	`question` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending_contact' NOT NULL,
	`created_at` integer NOT NULL
);
