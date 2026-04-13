DO $$
BEGIN
  CREATE TYPE "TuitionSubject" AS ENUM ('ENGLISH', 'MATHEMATICS', 'SCIENCE', 'STEM', 'READING', 'WRITING');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "PromotionOutcome" AS ENUM ('PENDING', 'PROMOTED', 'LEVEL_SKIPPED', 'FAILED', 'BORDERLINE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AdminLoginLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "userName" TEXT,
  "email" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "centreId" TEXT NOT NULL,
  "ipAddress" TEXT,
  "ipCountry" TEXT,
  "forwardedFor" TEXT,
  "userAgent" TEXT,
  "cfRay" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminLoginLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentAge" (
  "id" TEXT NOT NULL,
  "ageYear" INTEGER NOT NULL,
  "ageMonth" INTEGER NOT NULL,
  "displayLabel" TEXT NOT NULL,
  "australianYear" TEXT,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentAge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgeAssessmentLesson" (
  "id" TEXT NOT NULL,
  "assessmentAgeId" TEXT NOT NULL,
  "subject" "TuitionSubject" NOT NULL,
  "lessonNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "learningObjectives" JSONB,
  "difficultyScore" INTEGER NOT NULL,
  "estimatedMinutes" INTEGER NOT NULL DEFAULT 45,
  "curriculumCode" TEXT,
  "strandArea" TEXT,
  "exerciseIds" TEXT[],
  "contentData" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgeAssessmentLesson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StudentAgeAssessment" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "subject" "TuitionSubject" NOT NULL,
  "currentAgeId" TEXT NOT NULL,
  "currentLessonNumber" INTEGER NOT NULL DEFAULT 1,
  "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
  "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "placedById" TEXT NOT NULL,
  "placementMethod" TEXT NOT NULL DEFAULT 'DIAGNOSTIC',
  "placementNotes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "readyForPromotion" BOOLEAN NOT NULL DEFAULT false,
  "initialAgeId" TEXT,
  "centreId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentAgeAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgeLessonCompletion" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "placementId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "score" DOUBLE PRECISION,
  "maxScore" DOUBLE PRECISION DEFAULT 100,
  "percentageScore" DOUBLE PRECISION,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "timeSpentMinutes" INTEGER,
  "feedback" TEXT,
  "gradedById" TEXT,
  "gradedAt" TIMESTAMP(3),
  "sessionId" TEXT,
  "centreId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgeLessonCompletion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgePromotionTest" (
  "id" TEXT NOT NULL,
  "assessmentAgeId" TEXT NOT NULL,
  "subject" "TuitionSubject" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "questions" JSONB NOT NULL,
  "totalMarks" INTEGER NOT NULL DEFAULT 100,
  "passingScore" INTEGER NOT NULL DEFAULT 70,
  "excellenceScore" INTEGER NOT NULL DEFAULT 90,
  "timeLimit" INTEGER NOT NULL DEFAULT 60,
  "isAutoGraded" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgePromotionTest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgePromotionAttempt" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "placementId" TEXT NOT NULL,
  "promotionTestId" TEXT NOT NULL,
  "answers" JSONB NOT NULL,
  "score" DOUBLE PRECISION,
  "percentageScore" DOUBLE PRECISION,
  "outcome" "PromotionOutcome" NOT NULL DEFAULT 'PENDING',
  "promotedToAgeId" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "gradedAt" TIMESTAMP(3),
  "gradedById" TEXT,
  "feedback" TEXT,
  "centreId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgePromotionAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgeAssessmentHistory" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "placementId" TEXT NOT NULL,
  "subject" "TuitionSubject" NOT NULL,
  "fromAgeId" TEXT,
  "toAgeId" TEXT NOT NULL,
  "changeType" TEXT NOT NULL,
  "reason" TEXT,
  "testScore" DOUBLE PRECISION,
  "changedById" TEXT NOT NULL,
  "centreId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgeAssessmentHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminLoginLog_centreId_idx" ON "AdminLoginLog"("centreId");
CREATE INDEX IF NOT EXISTS "AdminLoginLog_userId_idx" ON "AdminLoginLog"("userId");
CREATE INDEX IF NOT EXISTS "AdminLoginLog_email_idx" ON "AdminLoginLog"("email");
CREATE INDEX IF NOT EXISTS "AdminLoginLog_createdAt_idx" ON "AdminLoginLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AdminLoginLog_success_idx" ON "AdminLoginLog"("success");

CREATE INDEX IF NOT EXISTS "AssessmentAge_ageYear_ageMonth_idx" ON "AssessmentAge"("ageYear", "ageMonth");
CREATE INDEX IF NOT EXISTS "AssessmentAge_ageYear_idx" ON "AssessmentAge"("ageYear");
CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentAge_ageYear_ageMonth_key" ON "AssessmentAge"("ageYear", "ageMonth");

CREATE INDEX IF NOT EXISTS "AgeAssessmentLesson_assessmentAgeId_subject_idx" ON "AgeAssessmentLesson"("assessmentAgeId", "subject");
CREATE INDEX IF NOT EXISTS "AgeAssessmentLesson_subject_idx" ON "AgeAssessmentLesson"("subject");
CREATE UNIQUE INDEX IF NOT EXISTS "AgeAssessmentLesson_assessmentAgeId_subject_lessonNumber_key" ON "AgeAssessmentLesson"("assessmentAgeId", "subject", "lessonNumber");

CREATE INDEX IF NOT EXISTS "StudentAgeAssessment_studentId_idx" ON "StudentAgeAssessment"("studentId");
CREATE INDEX IF NOT EXISTS "StudentAgeAssessment_centreId_idx" ON "StudentAgeAssessment"("centreId");
CREATE INDEX IF NOT EXISTS "StudentAgeAssessment_currentAgeId_idx" ON "StudentAgeAssessment"("currentAgeId");
CREATE INDEX IF NOT EXISTS "StudentAgeAssessment_status_idx" ON "StudentAgeAssessment"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "StudentAgeAssessment_studentId_subject_key" ON "StudentAgeAssessment"("studentId", "subject");

CREATE INDEX IF NOT EXISTS "AgeLessonCompletion_placementId_idx" ON "AgeLessonCompletion"("placementId");
CREATE INDEX IF NOT EXISTS "AgeLessonCompletion_studentId_idx" ON "AgeLessonCompletion"("studentId");
CREATE INDEX IF NOT EXISTS "AgeLessonCompletion_status_idx" ON "AgeLessonCompletion"("status");
CREATE INDEX IF NOT EXISTS "AgeLessonCompletion_centreId_idx" ON "AgeLessonCompletion"("centreId");
CREATE UNIQUE INDEX IF NOT EXISTS "AgeLessonCompletion_studentId_placementId_lessonId_key" ON "AgeLessonCompletion"("studentId", "placementId", "lessonId");

CREATE INDEX IF NOT EXISTS "AgePromotionTest_assessmentAgeId_idx" ON "AgePromotionTest"("assessmentAgeId");
CREATE INDEX IF NOT EXISTS "AgePromotionTest_subject_idx" ON "AgePromotionTest"("subject");
CREATE UNIQUE INDEX IF NOT EXISTS "AgePromotionTest_assessmentAgeId_subject_key" ON "AgePromotionTest"("assessmentAgeId", "subject");

CREATE INDEX IF NOT EXISTS "AgePromotionAttempt_studentId_idx" ON "AgePromotionAttempt"("studentId");
CREATE INDEX IF NOT EXISTS "AgePromotionAttempt_placementId_idx" ON "AgePromotionAttempt"("placementId");
CREATE INDEX IF NOT EXISTS "AgePromotionAttempt_promotionTestId_idx" ON "AgePromotionAttempt"("promotionTestId");
CREATE INDEX IF NOT EXISTS "AgePromotionAttempt_centreId_idx" ON "AgePromotionAttempt"("centreId");
CREATE INDEX IF NOT EXISTS "AgePromotionAttempt_outcome_idx" ON "AgePromotionAttempt"("outcome");

CREATE INDEX IF NOT EXISTS "AgeAssessmentHistory_studentId_subject_idx" ON "AgeAssessmentHistory"("studentId", "subject");
CREATE INDEX IF NOT EXISTS "AgeAssessmentHistory_placementId_idx" ON "AgeAssessmentHistory"("placementId");
CREATE INDEX IF NOT EXISTS "AgeAssessmentHistory_centreId_idx" ON "AgeAssessmentHistory"("centreId");
CREATE INDEX IF NOT EXISTS "AgeAssessmentHistory_createdAt_idx" ON "AgeAssessmentHistory"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdminLoginLog_centreId_fkey') THEN
    ALTER TABLE "AdminLoginLog"
      ADD CONSTRAINT "AdminLoginLog_centreId_fkey"
      FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdminLoginLog_userId_fkey') THEN
    ALTER TABLE "AdminLoginLog"
      ADD CONSTRAINT "AdminLoginLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeAssessmentLesson_assessmentAgeId_fkey') THEN
    ALTER TABLE "AgeAssessmentLesson"
      ADD CONSTRAINT "AgeAssessmentLesson_assessmentAgeId_fkey"
      FOREIGN KEY ("assessmentAgeId") REFERENCES "AssessmentAge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentAgeAssessment_studentId_fkey') THEN
    ALTER TABLE "StudentAgeAssessment"
      ADD CONSTRAINT "StudentAgeAssessment_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentAgeAssessment_currentAgeId_fkey') THEN
    ALTER TABLE "StudentAgeAssessment"
      ADD CONSTRAINT "StudentAgeAssessment_currentAgeId_fkey"
      FOREIGN KEY ("currentAgeId") REFERENCES "AssessmentAge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentAgeAssessment_initialAgeId_fkey') THEN
    ALTER TABLE "StudentAgeAssessment"
      ADD CONSTRAINT "StudentAgeAssessment_initialAgeId_fkey"
      FOREIGN KEY ("initialAgeId") REFERENCES "AssessmentAge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentAgeAssessment_placedById_fkey') THEN
    ALTER TABLE "StudentAgeAssessment"
      ADD CONSTRAINT "StudentAgeAssessment_placedById_fkey"
      FOREIGN KEY ("placedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentAgeAssessment_centreId_fkey') THEN
    ALTER TABLE "StudentAgeAssessment"
      ADD CONSTRAINT "StudentAgeAssessment_centreId_fkey"
      FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeLessonCompletion_studentId_fkey') THEN
    ALTER TABLE "AgeLessonCompletion"
      ADD CONSTRAINT "AgeLessonCompletion_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeLessonCompletion_placementId_fkey') THEN
    ALTER TABLE "AgeLessonCompletion"
      ADD CONSTRAINT "AgeLessonCompletion_placementId_fkey"
      FOREIGN KEY ("placementId") REFERENCES "StudentAgeAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeLessonCompletion_lessonId_fkey') THEN
    ALTER TABLE "AgeLessonCompletion"
      ADD CONSTRAINT "AgeLessonCompletion_lessonId_fkey"
      FOREIGN KEY ("lessonId") REFERENCES "AgeAssessmentLesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeLessonCompletion_gradedById_fkey') THEN
    ALTER TABLE "AgeLessonCompletion"
      ADD CONSTRAINT "AgeLessonCompletion_gradedById_fkey"
      FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeLessonCompletion_sessionId_fkey') THEN
    ALTER TABLE "AgeLessonCompletion"
      ADD CONSTRAINT "AgeLessonCompletion_sessionId_fkey"
      FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeLessonCompletion_centreId_fkey') THEN
    ALTER TABLE "AgeLessonCompletion"
      ADD CONSTRAINT "AgeLessonCompletion_centreId_fkey"
      FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgePromotionTest_assessmentAgeId_fkey') THEN
    ALTER TABLE "AgePromotionTest"
      ADD CONSTRAINT "AgePromotionTest_assessmentAgeId_fkey"
      FOREIGN KEY ("assessmentAgeId") REFERENCES "AssessmentAge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgePromotionAttempt_studentId_fkey') THEN
    ALTER TABLE "AgePromotionAttempt"
      ADD CONSTRAINT "AgePromotionAttempt_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgePromotionAttempt_placementId_fkey') THEN
    ALTER TABLE "AgePromotionAttempt"
      ADD CONSTRAINT "AgePromotionAttempt_placementId_fkey"
      FOREIGN KEY ("placementId") REFERENCES "StudentAgeAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgePromotionAttempt_promotionTestId_fkey') THEN
    ALTER TABLE "AgePromotionAttempt"
      ADD CONSTRAINT "AgePromotionAttempt_promotionTestId_fkey"
      FOREIGN KEY ("promotionTestId") REFERENCES "AgePromotionTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgePromotionAttempt_promotedToAgeId_fkey') THEN
    ALTER TABLE "AgePromotionAttempt"
      ADD CONSTRAINT "AgePromotionAttempt_promotedToAgeId_fkey"
      FOREIGN KEY ("promotedToAgeId") REFERENCES "AssessmentAge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgePromotionAttempt_gradedById_fkey') THEN
    ALTER TABLE "AgePromotionAttempt"
      ADD CONSTRAINT "AgePromotionAttempt_gradedById_fkey"
      FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgePromotionAttempt_centreId_fkey') THEN
    ALTER TABLE "AgePromotionAttempt"
      ADD CONSTRAINT "AgePromotionAttempt_centreId_fkey"
      FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeAssessmentHistory_studentId_fkey') THEN
    ALTER TABLE "AgeAssessmentHistory"
      ADD CONSTRAINT "AgeAssessmentHistory_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeAssessmentHistory_placementId_fkey') THEN
    ALTER TABLE "AgeAssessmentHistory"
      ADD CONSTRAINT "AgeAssessmentHistory_placementId_fkey"
      FOREIGN KEY ("placementId") REFERENCES "StudentAgeAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeAssessmentHistory_fromAgeId_fkey') THEN
    ALTER TABLE "AgeAssessmentHistory"
      ADD CONSTRAINT "AgeAssessmentHistory_fromAgeId_fkey"
      FOREIGN KEY ("fromAgeId") REFERENCES "AssessmentAge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeAssessmentHistory_toAgeId_fkey') THEN
    ALTER TABLE "AgeAssessmentHistory"
      ADD CONSTRAINT "AgeAssessmentHistory_toAgeId_fkey"
      FOREIGN KEY ("toAgeId") REFERENCES "AssessmentAge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeAssessmentHistory_changedById_fkey') THEN
    ALTER TABLE "AgeAssessmentHistory"
      ADD CONSTRAINT "AgeAssessmentHistory_changedById_fkey"
      FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgeAssessmentHistory_centreId_fkey') THEN
    ALTER TABLE "AgeAssessmentHistory"
      ADD CONSTRAINT "AgeAssessmentHistory_centreId_fkey"
      FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
