-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `discord_id` VARCHAR(191) NULL,
    `github_username` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL DEFAULT 0,
    `main_endpoint` VARCHAR(191) NULL,
    `backup_endpoint` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
