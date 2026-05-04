/*
  Warnings:

  - You are about to alter the column `platform` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Enum(EnumId(1))`.
  - You are about to alter the column `recitation` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `platform` ENUM('MOBILE_NETWORKS', 'INTERNET', 'BOTH') NULL,
    MODIFY `recitation` ENUM('HAFS', 'WARSH') NULL;
