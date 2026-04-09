-- AlterTable
ALTER TABLE `group_members` ADD COLUMN `removed_at` DATETIME(3) NULL,
    ADD COLUMN `removed_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('ALERT_ASSIGNED', 'LEARNER_DEACTIVATED', 'LEARNER_REMOVED', 'REQUEST_CREATED', 'REQUEST_UPDATED') NOT NULL;

-- CreateIndex
CREATE INDEX `group_members_removed_at_idx` ON `group_members`(`removed_at`);

-- CreateIndex
CREATE INDEX `group_members_removed_by_idx` ON `group_members`(`removed_by`);

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_removed_by_fkey` FOREIGN KEY (`removed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
