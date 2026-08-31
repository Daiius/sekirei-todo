CREATE TABLE `Projects` (
	`id` varchar(256) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT PRIMARY KEY(`id`,`userId`),
	CONSTRAINT `id_unique` UNIQUE INDEX(`id`)
);
--> statement-breakpoint
CREATE TABLE `Tasks` (
	`id` serial NOT NULL,
	`userId` varchar(36) NOT NULL,
	`projectId` varchar(256),
	`content` varchar(512) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`done` boolean NOT NULL DEFAULT false,
	CONSTRAINT PRIMARY KEY(`id`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` varchar(36) PRIMARY KEY,
	`issuer` varchar(255) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp(3),
	`refresh_token_expires_at` timestamp(3),
	`scope` text,
	`password` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL,
	CONSTRAINT `account_issuer_accountId_idx` UNIQUE INDEX(`issuer`,`account_id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(36) PRIMARY KEY,
	`expires_at` timestamp(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(36) NOT NULL,
	CONSTRAINT `token_unique` UNIQUE INDEX(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(36) PRIMARY KEY,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `email_unique` UNIQUE INDEX(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(36) PRIMARY KEY,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now())
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
ALTER TABLE `Tasks` ADD CONSTRAINT `Tasks_projectId_Projects_id_fkey` FOREIGN KEY (`projectId`) REFERENCES `Projects`(`id`);--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE;