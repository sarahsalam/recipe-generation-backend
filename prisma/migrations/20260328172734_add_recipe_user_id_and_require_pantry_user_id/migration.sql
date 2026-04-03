/*
  Warnings:

  - Made the column `userId` on table `PantryItem` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `userId` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PantryItem" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "userId" TEXT NOT NULL;
