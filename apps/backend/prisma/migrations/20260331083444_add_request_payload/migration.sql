/*
  Warnings:

  - You are about to drop the column `reason` on the `requests` table. All the data in the column will be lost.
  - Added the required column `payload` to the `requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `requests` DROP COLUMN `reason`,
    ADD COLUMN `payload` JSON NOT NULL;

-- CreateIndex
CREATE INDEX `requests_type_idx` ON `requests`(`type`);
