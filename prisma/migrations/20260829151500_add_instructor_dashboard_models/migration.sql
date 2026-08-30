-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "NudgeStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'SENT');

-- CreateTable
CREATE TABLE "StudentRisk" (
    "riskId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "StudentRisk_pkey" PRIMARY KEY ("riskId")
);

-- CreateTable
CREATE TABLE "LoginActivity" (
    "loginId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "loginTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginActivity_pkey" PRIMARY KEY ("loginId")
);

-- CreateTable
CREATE TABLE "Nudge" (
    "nudgeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "status" "NudgeStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Nudge_pkey" PRIMARY KEY ("nudgeId")
);

-- AddForeignKey
ALTER TABLE "StudentRisk" ADD CONSTRAINT "StudentRisk_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginActivity" ADD CONSTRAINT "LoginActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
