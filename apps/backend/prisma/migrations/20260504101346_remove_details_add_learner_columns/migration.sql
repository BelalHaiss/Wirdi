/*
  Warnings:

  - You are about to drop the column `details` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `details`,
    ADD COLUMN `age` INTEGER NULL,
    ADD COLUMN `platform` VARCHAR(100) NULL,
    ADD COLUMN `recitation` VARCHAR(100) NULL,
    ADD COLUMN `schedule` TINYINT NULL;
