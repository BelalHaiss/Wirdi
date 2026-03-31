-- DropIndex
DROP INDEX `requests_type_idx` ON `requests`;

-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('ALERT_ASSIGNED', 'LEARNER_DEACTIVATED', 'REQUEST_CREATED', 'REQUEST_UPDATED') NOT NULL;
