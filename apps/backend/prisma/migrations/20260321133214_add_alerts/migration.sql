-- CreateTable
CREATE TABLE `alerts` (
    `id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `week_id` VARCHAR(191) NOT NULL,
    `day_number` TINYINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `alerts_student_id_week_id_day_number_key`(`student_id`, `week_id`, `day_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_week_id_fkey` FOREIGN KEY (`week_id`) REFERENCES `weeks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
