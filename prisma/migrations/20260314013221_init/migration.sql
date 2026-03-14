-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `googleId` VARCHAR(191) NULL,
    `firstname` VARCHAR(191) NULL,
    `lastname` VARCHAR(191) NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `tokenVersion` INTEGER NOT NULL DEFAULT 1,
    `resetPasswordToken` VARCHAR(191) NULL,
    `imageId` CHAR(36) NULL,

    UNIQUE INDEX `User_googleId_key`(`googleId`),
    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_imageId_key`(`imageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Exercise` (
    `id` CHAR(36) NOT NULL,
    `exerciseId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `bodyParts` JSON NOT NULL,
    `equipments` JSON NOT NULL,
    `exerciseType` VARCHAR(191) NOT NULL,
    `targetMuscles` JSON NOT NULL,
    `secondaryMuscles` JSON NOT NULL,
    `keywords` JSON NOT NULL,

    UNIQUE INDEX `Exercise_exerciseId_key`(`exerciseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Workout` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `estimatedDuration` INTEGER NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `imageId` CHAR(36) NULL,
    `userId` CHAR(36) NOT NULL,

    UNIQUE INDEX `Workout_imageId_key`(`imageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompletedWorkout` (
    `workoutId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `completedAt` DATE NOT NULL,

    PRIMARY KEY (`workoutId`, `userId`, `completedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExerciseWorkout` (
    `workoutId` CHAR(36) NOT NULL,
    `exerciseId` CHAR(36) NOT NULL,
    `exerciseOrder` INTEGER NOT NULL,
    `reps` INTEGER NOT NULL,
    `sets` INTEGER NOT NULL,

    PRIMARY KEY (`workoutId`, `exerciseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Image` (
    `id` CHAR(36) NOT NULL,
    `filename` VARCHAR(191) NULL,
    `url` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contacts` (
    `id` CHAR(36) NOT NULL,
    `senderEmail` VARCHAR(191) NOT NULL,
    `message` LONGTEXT NOT NULL,
    `contactedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Contacts_senderEmail_key`(`senderEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Workout` ADD CONSTRAINT `Workout_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Workout` ADD CONSTRAINT `Workout_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompletedWorkout` ADD CONSTRAINT `CompletedWorkout_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExerciseWorkout` ADD CONSTRAINT `ExerciseWorkout_workoutId_fkey` FOREIGN KEY (`workoutId`) REFERENCES `Workout`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExerciseWorkout` ADD CONSTRAINT `ExerciseWorkout_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `Exercise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
