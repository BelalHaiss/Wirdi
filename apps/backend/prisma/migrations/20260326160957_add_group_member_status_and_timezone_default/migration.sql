-- AlterTable
ALTER TABLE `group_members` ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `groups` MODIFY `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Riyadh';
