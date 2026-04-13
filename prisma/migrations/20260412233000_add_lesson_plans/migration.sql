-- CreateEnum
CREATE TYPE "LessonPlanType" AS ENUM ('STANDARD', 'MATHEMATICS');

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "planType" "LessonPlanType" NOT NULL DEFAULT 'STANDARD',
    "estimatedDuration" INTEGER,
    "objectives" JSONB,
    "overview" TEXT,
    "warmUp" TEXT,
    "directInstruction" TEXT,
    "guidedPractice" TEXT,
    "independentPractice" TEXT,
    "assessment" TEXT,
    "homework" TEXT,
    "resources" TEXT,
    "teacherNotes" TEXT,
    "mathExpressions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonPlan_lessonId_key" ON "LessonPlan"("lessonId");

-- CreateIndex
CREATE INDEX "LessonPlan_planType_idx" ON "LessonPlan"("planType");

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

