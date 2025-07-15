CREATE TABLE `classifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`image_id` int,
	`classificationResult` varchar(255) NOT NULL,
	`confidence` double NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `classifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(255) NOT NULL,
	`uploadedAt` timestamp DEFAULT (now()),
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submission_img` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submission_id` int,
	`imageUrl` varchar(255) NOT NULL,
	CONSTRAINT `submission_img_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `classifications` ADD CONSTRAINT `classifications_image_id_submission_img_id_fk` FOREIGN KEY (`image_id`) REFERENCES `submission_img`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submission_img` ADD CONSTRAINT `submission_img_submission_id_submissions_id_fk` FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE no action ON UPDATE no action;