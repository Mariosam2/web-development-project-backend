/*
  Warnings:

  - The primary key for the `completedworkout` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `completedworkout` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`workoutId`, `userId`, `completedAt`);
