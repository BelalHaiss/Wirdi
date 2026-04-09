-- AlterTable
ALTER TABLE `users` ADD COLUMN `name_normalized` VARCHAR(100) NULL;

-- CreateIndex
CREATE INDEX `users_name_normalized_idx` ON `users`(`name_normalized`);
