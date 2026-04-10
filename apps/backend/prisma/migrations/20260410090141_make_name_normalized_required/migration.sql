/*
  Warnings:

  - Made the column `name_normalized` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill: copy `name` into `name_normalized` for any rows that are still NULL
UPDATE `users` SET `name_normalized` = `name` WHERE `name_normalized` IS NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `name_normalized` VARCHAR(100) NOT NULL;
