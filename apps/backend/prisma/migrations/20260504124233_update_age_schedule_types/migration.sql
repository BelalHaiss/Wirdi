/*
  Warnings:

  - You are about to alter the column `age` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Int` to `UnsignedTinyInt`.
  - You are about to alter the column `schedule` on the `users` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `UnsignedSmallInt`.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `age` TINYINT UNSIGNED NULL,
    MODIFY `schedule` SMALLINT UNSIGNED NULL;
