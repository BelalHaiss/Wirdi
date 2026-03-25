/*
  Warnings:

  - A unique constraint covering the columns `[week_id]` on the table `schedule_images` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `schedule_images_week_id_key` ON `schedule_images`(`week_id`);
