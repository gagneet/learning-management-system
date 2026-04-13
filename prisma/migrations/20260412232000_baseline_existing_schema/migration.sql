-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'CENTER_ADMIN', 'CENTER_SUPERVISOR', 'FINANCE_ADMIN', 'TEACHER', 'PARENT', 'STUDENT');

-- CreateEnum
CREATE TYPE "AgeTier" AS ENUM ('TIER1', 'TIER2', 'TIER3');

-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'GRAY', 'DARK');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('ONLINE', 'PHYSICAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('DOCUMENT', 'VIDEO', 'SCORM', 'XAPI', 'EMBED', 'QUIZ');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('STUDENT_FEE', 'STUDENT_PAYMENT', 'TUTOR_PAYMENT', 'OPERATIONAL_COST', 'REFUND');

-- CreateEnum
CREATE TYPE "SessionProvider" AS ENUM ('TEAMS', 'ZOOM', 'CHIME', 'OTHER');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('COMPLETION', 'STREAK', 'MASTERY', 'PARTICIPATION', 'SPECIAL');

-- CreateEnum
CREATE TYPE "XPSource" AS ENUM ('LESSON_COMPLETION', 'HOMEWORK_SUBMISSION', 'HOMEWORK_ONTIME', 'SESSION_ATTENDANCE', 'QUIZ_COMPLETION', 'QUIZ_PERFECT', 'READING_ACTIVITY', 'HELPING_PEER', 'STREAK_MILESTONE', 'AWARD_REDEMPTION', 'AWARD_REFUND', 'GOAL_COMPLETE', 'EXERCISE_COMPLETE');

-- CreateEnum
CREATE TYPE "BadgeCategory" AS ENUM ('COMPLETION', 'STREAK', 'MASTERY', 'SOCIAL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "BadgeTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "StreakType" AS ENUM ('ATTENDANCE', 'HOMEWORK', 'READING', 'LOGIN');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ESCALATE');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('REFUND', 'TUTOR_OVERRIDE', 'PAYROLL_EXCEPTION', 'FEE_WAIVER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('ENGLISH', 'MATHEMATICS', 'STEM', 'SCIENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'DROPPED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CatchUpStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('IT', 'INVENTORY', 'COMPLAINT', 'MAINTENANCE', 'GENERAL');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "BillingFrequency" AS ENUM ('ONE_TIME', 'WEEKLY', 'MONTHLY', 'TERM', 'ANNUAL');

-- CreateEnum
CREATE TYPE "FeePlanStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHECK', 'BANK_TRANSFER', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "ProfileUpdateType" AS ENUM ('ASSESSMENT_RESULT', 'TUTOR_OVERRIDE', 'DIAGNOSTIC_TEST', 'LEVEL_ADVANCEMENT', 'LEVEL_REGRESSION');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'SHORT_ANSWER', 'LONG_ANSWER', 'NUMERICAL', 'MATCHING', 'WORKSHEET');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_GRADED', 'UNDER_REVIEW', 'GRADED');

-- CreateEnum
CREATE TYPE "HomeworkStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'RETURNED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'COMPLETED', 'RETURNED');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('NOT_STARTED', 'WORKING', 'WAITING_HELP', 'COMPLETED', 'IDLE');

-- CreateEnum
CREATE TYPE "HelpRequestStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HelpRequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NoteVisibility" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "ChatMessageType" AS ENUM ('STUDENT_TO_TUTOR', 'TUTOR_TO_STUDENT', 'STUDENT_TO_STUDENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AwardType" AS ENUM ('GIFT', 'STICKER', 'COURSE_UNLOCK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'FULFILLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'WEEKLY');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('DAILY', 'JITSI', 'CUSTOM', 'NONE');

-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED', 'DELETED');

-- CreateTable
CREATE TABLE "Center" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "region" TEXT,
    "branding" JSONB,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Center_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "avatar" TEXT,
    "bio" TEXT,
    "languagePreference" TEXT NOT NULL DEFAULT 'en',
    "accessibilitySettings" JSONB,
    "specialNeeds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "ageTier" "AgeTier" NOT NULL DEFAULT 'TIER3',
    "themePreference" "ThemePreference" NOT NULL DEFAULT 'LIGHT',
    "centerId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "centerId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moduleId" TEXT NOT NULL,
    "unitId" TEXT,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "url" TEXT NOT NULL,
    "duration" INTEGER,
    "fileSize" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lessonId" TEXT NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "tutorId" TEXT,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicProfile" (
    "id" TEXT NOT NULL,
    "chronologicalAge" DOUBLE PRECISION,
    "readingAge" DOUBLE PRECISION,
    "numeracyAge" DOUBLE PRECISION,
    "comprehensionIndex" DOUBLE PRECISION,
    "writingProficiency" DOUBLE PRECISION,
    "subjectLevels" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AcademicProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "provider" "SessionProvider" NOT NULL,
    "providerMeetingId" TEXT,
    "joinUrl" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
    "duration" INTEGER,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "recordingUrl" TEXT,
    "transcriptUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionMode" "SessionMode" NOT NULL DEFAULT 'ONLINE',
    "meetingLink" TEXT,
    "physicalLocation" TEXT,
    "videoProvider" "VideoProvider" NOT NULL DEFAULT 'DAILY',
    "videoRoomId" TEXT,
    "videoRoomUrl" TEXT,
    "recordingStartedAt" TIMESTAMP(3),
    "tutorId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "classId" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSessionEnrollment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT,
    "lessonId" TEXT,
    "exerciseContent" JSONB,
    "assessmentData" JSONB,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "centreId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "activeMs" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSessionEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionAttendance" (
    "id" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SessionAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamificationProfile" (
    "id" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalXP" INTEGER DEFAULT 0,
    "nextLevelXP" INTEGER DEFAULT 100,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GamificationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "BadgeType" NOT NULL,
    "iconUrl" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XPTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "XPSource" NOT NULL,
    "sourceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XPTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "BadgeCategory" NOT NULL,
    "tier" "BadgeTier" NOT NULL,
    "iconUrl" TEXT,
    "xpValue" INTEGER NOT NULL DEFAULT 0,
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeAward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BadgeAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "StreakType" NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "freezesAvailable" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardOptIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL DEFAULT 'class',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardOptIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" "Role" NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "centreId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedByName" TEXT,
    "approvedAt" TIMESTAMP(3),
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "comment" TEXT,
    "centreId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassCohort" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "subjectEnum" "Subject",
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "gradeMin" INTEGER,
    "gradeMax" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxCapacity" INTEGER NOT NULL DEFAULT 20,
    "currentEnrollment" INTEGER NOT NULL DEFAULT 0,
    "status" "ClassStatus" NOT NULL DEFAULT 'ACTIVE',
    "teacherId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassCohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassMembership" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "centreId" TEXT NOT NULL,

    CONSTRAINT "ClassMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "markedAt" TIMESTAMP(3),
    "markedById" TEXT,
    "notes" TEXT,
    "centreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatchUpPackage" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "status" "CatchUpStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "slaDueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "resources" JSONB NOT NULL,
    "notes" TEXT,
    "centreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatchUpPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "priority" "TicketPriority" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "resolution" TEXT,
    "slaDueAt" TIMESTAMP(3) NOT NULL,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "centreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAttachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SLAConfig" (
    "id" TEXT NOT NULL,
    "ticketType" "TicketType" NOT NULL,
    "priority" "TicketPriority" NOT NULL,
    "responseTimeHours" INTEGER NOT NULL,
    "resolutionTimeHours" INTEGER NOT NULL,
    "centreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SLAConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "frequency" "BillingFrequency" NOT NULL,
    "applicableCourses" JSONB,
    "applicableClasses" JSONB,
    "status" "FeePlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "centreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAccount" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "totalBilled" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalRefunded" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "centreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "studentAccountId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feePlanId" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "centreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "refundMethod" TEXT,
    "processedDate" TIMESTAMP(3),
    "processedReference" TEXT,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalRequestId" TEXT,
    "centreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectAssessment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "assessedGradeLevel" INTEGER NOT NULL,
    "readingAge" DOUBLE PRECISION,
    "numeracyAge" DOUBLE PRECISION,
    "comprehensionLevel" DOUBLE PRECISION,
    "writingLevel" DOUBLE PRECISION,
    "lastAssessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicProfileLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "subjectAssessmentId" TEXT NOT NULL,
    "previousLevel" INTEGER NOT NULL,
    "newLevel" INTEGER NOT NULL,
    "updateType" "ProfileUpdateType" NOT NULL,
    "reason" TEXT,
    "updatedById" TEXT NOT NULL,
    "assessmentReviewId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicProfileLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeLevel" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "GradeLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentUnit" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "gradeLevelId" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "unitId" TEXT,
    "sequenceOrder" INTEGER NOT NULL,
    "exerciseType" "ExerciseType" NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "questions" JSONB NOT NULL,
    "expectedAnswers" JSONB,
    "maxScore" INTEGER NOT NULL,
    "timeLimit" INTEGER,
    "isAutoGradable" BOOLEAN NOT NULL DEFAULT false,
    "difficulty" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseAttempt" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sessionEnrollmentId" TEXT,
    "homeworkAssignmentId" TEXT,
    "answers" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "maxScore" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "autoGraded" BOOLEAN NOT NULL DEFAULT false,
    "timeSpent" INTEGER,
    "questionTimes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeworkAssignment" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "sessionEnrollmentId" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "HomeworkStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "totalMaxScore" INTEGER NOT NULL DEFAULT 0,
    "totalScore" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "gradedById" TEXT,
    "feedback" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeworkAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeworkExercise" (
    "id" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeworkExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentReview" (
    "id" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "exerciseAttemptId" TEXT,
    "physicalWorkUploadId" TEXT,
    "rubricId" TEXT,
    "criteriaScores" JSONB,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentRubric" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "gradeLevelId" TEXT NOT NULL,
    "exerciseType" "ExerciseType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalWorkUpload" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "sessionEnrollmentId" TEXT,
    "imageUrls" TEXT[],
    "qrCodeIdentifier" TEXT,
    "annotations" JSONB,
    "uploadedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhysicalWorkUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSessionActivity" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "status" "ActivityStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSessionActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "exerciseId" TEXT,
    "message" TEXT,
    "priority" "HelpRequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "HelpRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "responseText" TEXT,
    "slaDueAt" TIMESTAMP(3),
    "centreId" TEXT NOT NULL,

    CONSTRAINT "HelpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorNote" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT,
    "tutorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" "NoteVisibility" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAssignment" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sessionEnrollmentId" TEXT,
    "exerciseId" TEXT,
    "overridesAutoSequence" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGoal" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "goalText" TEXT NOT NULL,
    "category" TEXT,
    "targetDate" TIMESTAMP(3),
    "isAchieved" BOOLEAN NOT NULL DEFAULT false,
    "achievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentStrengthWeakness" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "identifiedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentStrengthWeakness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT,
    "messageType" "ChatMessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentUrls" TEXT[],
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "awardType" "AwardType" NOT NULL,
    "xpCost" INTEGER NOT NULL,
    "stockQuantity" INTEGER,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardRedemption" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "awardId" TEXT NOT NULL,
    "xpSpent" INTEGER NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "AwardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionTemplate" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "sessionMode" "SessionMode" NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 15,
    "title" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassScheduleRule" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "recurrence" "RecurrenceType" NOT NULL DEFAULT 'WEEKLY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "daysOfWeek" INTEGER[],
    "startTime" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassScheduleRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteboardState" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "stateJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteboardState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "activityId" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPresenceLog" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionPresenceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "videoEnabled" BOOLEAN NOT NULL DEFAULT true,
    "audioEnabled" BOOLEAN NOT NULL DEFAULT true,
    "screenShareEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VideoParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoRecording" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "downloadUrl" TEXT,
    "streamUrl" TEXT,
    "transcriptionUrl" TEXT,
    "status" "RecordingStatus" NOT NULL DEFAULT 'PROCESSING',
    "centreId" TEXT NOT NULL,

    CONSTRAINT "VideoRecording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Center_slug_key" ON "Center"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_centerId_idx" ON "User"("centerId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_parentId_idx" ON "User"("parentId");

-- CreateIndex
CREATE INDEX "Course_centerId_idx" ON "Course"("centerId");

-- CreateIndex
CREATE INDEX "Course_teacherId_idx" ON "Course"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_centerId_slug_key" ON "Course"("centerId", "slug");

-- CreateIndex
CREATE INDEX "Module_courseId_idx" ON "Module"("courseId");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");

-- CreateIndex
CREATE INDEX "Lesson_unitId_idx" ON "Lesson"("unitId");

-- CreateIndex
CREATE INDEX "Content_lessonId_idx" ON "Content"("lessonId");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE INDEX "Enrollment_tutorId_idx" ON "Enrollment"("tutorId");

-- CreateIndex
CREATE INDEX "Enrollment_userId_enrolledAt_idx" ON "Enrollment"("userId", "enrolledAt");

-- CreateIndex
CREATE INDEX "Enrollment_userId_completedAt_idx" ON "Enrollment"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "Progress_userId_idx" ON "Progress"("userId");

-- CreateIndex
CREATE INDEX "Progress_lessonId_idx" ON "Progress"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_lessonId_key" ON "Progress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicProfile_userId_key" ON "AcademicProfile"("userId");

-- CreateIndex
CREATE INDEX "AcademicProfile_userId_idx" ON "AcademicProfile"("userId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_userId_idx" ON "FinancialTransaction"("userId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_centerId_idx" ON "FinancialTransaction"("centerId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_type_idx" ON "FinancialTransaction"("type");

-- CreateIndex
CREATE INDEX "FinancialTransaction_createdAt_idx" ON "FinancialTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_videoRoomId_key" ON "Session"("videoRoomId");

-- CreateIndex
CREATE INDEX "Session_tutorId_idx" ON "Session"("tutorId");

-- CreateIndex
CREATE INDEX "Session_startTime_idx" ON "Session"("startTime");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "Session_classId_idx" ON "Session"("classId");

-- CreateIndex
CREATE INDEX "Session_videoRoomId_idx" ON "Session"("videoRoomId");

-- CreateIndex
CREATE INDEX "Session_tutorId_startTime_idx" ON "Session"("tutorId", "startTime");

-- CreateIndex
CREATE INDEX "Session_centreId_startTime_idx" ON "Session"("centreId", "startTime");

-- CreateIndex
CREATE INDEX "StudentSessionEnrollment_sessionId_idx" ON "StudentSessionEnrollment"("sessionId");

-- CreateIndex
CREATE INDEX "StudentSessionEnrollment_studentId_idx" ON "StudentSessionEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "StudentSessionEnrollment_courseId_idx" ON "StudentSessionEnrollment"("courseId");

-- CreateIndex
CREATE INDEX "StudentSessionEnrollment_lessonId_idx" ON "StudentSessionEnrollment"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSessionEnrollment_sessionId_studentId_key" ON "StudentSessionEnrollment"("sessionId", "studentId");

-- CreateIndex
CREATE INDEX "SessionAttendance_sessionId_idx" ON "SessionAttendance"("sessionId");

-- CreateIndex
CREATE INDEX "SessionAttendance_userId_idx" ON "SessionAttendance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionAttendance_sessionId_userId_key" ON "SessionAttendance"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GamificationProfile_userId_key" ON "GamificationProfile"("userId");

-- CreateIndex
CREATE INDEX "GamificationProfile_userId_idx" ON "GamificationProfile"("userId");

-- CreateIndex
CREATE INDEX "GamificationProfile_level_idx" ON "GamificationProfile"("level");

-- CreateIndex
CREATE INDEX "GamificationProfile_xp_idx" ON "GamificationProfile"("xp");

-- CreateIndex
CREATE INDEX "Badge_profileId_idx" ON "Badge"("profileId");

-- CreateIndex
CREATE INDEX "Badge_type_idx" ON "Badge"("type");

-- CreateIndex
CREATE INDEX "Achievement_profileId_idx" ON "Achievement"("profileId");

-- CreateIndex
CREATE INDEX "Achievement_category_idx" ON "Achievement"("category");

-- CreateIndex
CREATE INDEX "XPTransaction_userId_idx" ON "XPTransaction"("userId");

-- CreateIndex
CREATE INDEX "XPTransaction_createdAt_idx" ON "XPTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "XPTransaction_source_idx" ON "XPTransaction"("source");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeDefinition_name_key" ON "BadgeDefinition"("name");

-- CreateIndex
CREATE INDEX "BadgeDefinition_category_idx" ON "BadgeDefinition"("category");

-- CreateIndex
CREATE INDEX "BadgeDefinition_tier_idx" ON "BadgeDefinition"("tier");

-- CreateIndex
CREATE INDEX "BadgeAward_userId_idx" ON "BadgeAward"("userId");

-- CreateIndex
CREATE INDEX "BadgeAward_awardedAt_idx" ON "BadgeAward"("awardedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeAward_userId_badgeId_key" ON "BadgeAward"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "Streak_userId_key" ON "Streak"("userId");

-- CreateIndex
CREATE INDEX "Streak_userId_idx" ON "Streak"("userId");

-- CreateIndex
CREATE INDEX "Streak_type_idx" ON "Streak"("type");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardOptIn_userId_key" ON "LeaderboardOptIn"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_centreId_idx" ON "AuditEvent"("centreId");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_idx" ON "AuditEvent"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_resourceType_resourceId_idx" ON "AuditEvent"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditEvent_action_idx" ON "AuditEvent"("action");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_centreId_status_idx" ON "ApprovalRequest"("centreId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requestedById_idx" ON "ApprovalRequest"("requestedById");

-- CreateIndex
CREATE INDEX "ApprovalRequest_approvedById_idx" ON "ApprovalRequest"("approvedById");

-- CreateIndex
CREATE INDEX "ApprovalRequest_type_idx" ON "ApprovalRequest"("type");

-- CreateIndex
CREATE INDEX "ApprovalRequest_expiresAt_idx" ON "ApprovalRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "ClassCohort_centreId_idx" ON "ClassCohort"("centreId");

-- CreateIndex
CREATE INDEX "ClassCohort_teacherId_idx" ON "ClassCohort"("teacherId");

-- CreateIndex
CREATE INDEX "ClassCohort_status_idx" ON "ClassCohort"("status");

-- CreateIndex
CREATE INDEX "ClassCohort_startDate_endDate_idx" ON "ClassCohort"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "ClassMembership_classId_idx" ON "ClassMembership"("classId");

-- CreateIndex
CREATE INDEX "ClassMembership_studentId_idx" ON "ClassMembership"("studentId");

-- CreateIndex
CREATE INDEX "ClassMembership_centreId_status_idx" ON "ClassMembership"("centreId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClassMembership_classId_studentId_key" ON "ClassMembership"("classId", "studentId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_sessionId_idx" ON "AttendanceRecord"("sessionId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_centreId_sessionId_idx" ON "AttendanceRecord"("centreId", "sessionId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_key" ON "AttendanceRecord"("sessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CatchUpPackage_attendanceId_key" ON "CatchUpPackage"("attendanceId");

-- CreateIndex
CREATE INDEX "CatchUpPackage_studentId_status_idx" ON "CatchUpPackage"("studentId", "status");

-- CreateIndex
CREATE INDEX "CatchUpPackage_centreId_idx" ON "CatchUpPackage"("centreId");

-- CreateIndex
CREATE INDEX "CatchUpPackage_dueDate_idx" ON "CatchUpPackage"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE INDEX "Ticket_centreId_status_idx" ON "Ticket"("centreId", "status");

-- CreateIndex
CREATE INDEX "Ticket_createdById_idx" ON "Ticket"("createdById");

-- CreateIndex
CREATE INDEX "Ticket_assignedToId_idx" ON "Ticket"("assignedToId");

-- CreateIndex
CREATE INDEX "Ticket_ticketNumber_idx" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE INDEX "Ticket_slaDueAt_idx" ON "Ticket"("slaDueAt");

-- CreateIndex
CREATE INDEX "Ticket_centreId_status_slaDueAt_idx" ON "Ticket"("centreId", "status", "slaDueAt");

-- CreateIndex
CREATE INDEX "TicketComment_ticketId_idx" ON "TicketComment"("ticketId");

-- CreateIndex
CREATE INDEX "TicketComment_userId_idx" ON "TicketComment"("userId");

-- CreateIndex
CREATE INDEX "TicketAttachment_ticketId_idx" ON "TicketAttachment"("ticketId");

-- CreateIndex
CREATE INDEX "SLAConfig_centreId_idx" ON "SLAConfig"("centreId");

-- CreateIndex
CREATE UNIQUE INDEX "SLAConfig_centreId_ticketType_priority_key" ON "SLAConfig"("centreId", "ticketType", "priority");

-- CreateIndex
CREATE INDEX "FeePlan_centreId_status_idx" ON "FeePlan"("centreId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAccount_studentId_key" ON "StudentAccount"("studentId");

-- CreateIndex
CREATE INDEX "StudentAccount_centreId_idx" ON "StudentAccount"("centreId");

-- CreateIndex
CREATE INDEX "StudentAccount_studentId_idx" ON "StudentAccount"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_centreId_status_idx" ON "Invoice"("centreId", "status");

-- CreateIndex
CREATE INDEX "Invoice_studentId_idx" ON "Invoice"("studentId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Invoice_centreId_status_dueDate_idx" ON "Invoice"("centreId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_centreId_idx" ON "Payment"("centreId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_refundNumber_key" ON "Refund"("refundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_approvalRequestId_key" ON "Refund"("approvalRequestId");

-- CreateIndex
CREATE INDEX "Refund_centreId_status_idx" ON "Refund"("centreId", "status");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE INDEX "Refund_refundNumber_idx" ON "Refund"("refundNumber");

-- CreateIndex
CREATE INDEX "SubjectAssessment_studentId_idx" ON "SubjectAssessment"("studentId");

-- CreateIndex
CREATE INDEX "SubjectAssessment_courseId_idx" ON "SubjectAssessment"("courseId");

-- CreateIndex
CREATE INDEX "SubjectAssessment_assessedGradeLevel_idx" ON "SubjectAssessment"("assessedGradeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectAssessment_studentId_courseId_key" ON "SubjectAssessment"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "AcademicProfileLog_studentId_courseId_idx" ON "AcademicProfileLog"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "AcademicProfileLog_createdAt_idx" ON "AcademicProfileLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GradeLevel_level_key" ON "GradeLevel"("level");

-- CreateIndex
CREATE INDEX "GradeLevel_level_idx" ON "GradeLevel"("level");

-- CreateIndex
CREATE INDEX "ContentUnit_courseId_gradeLevelId_idx" ON "ContentUnit"("courseId", "gradeLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentUnit_courseId_gradeLevelId_sequenceOrder_key" ON "ContentUnit"("courseId", "gradeLevelId", "sequenceOrder");

-- CreateIndex
CREATE INDEX "Exercise_lessonId_idx" ON "Exercise"("lessonId");

-- CreateIndex
CREATE INDEX "Exercise_exerciseType_idx" ON "Exercise"("exerciseType");

-- CreateIndex
CREATE INDEX "Exercise_isActive_idx" ON "Exercise"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_lessonId_sequenceOrder_key" ON "Exercise"("lessonId", "sequenceOrder");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_studentId_exerciseId_idx" ON "ExerciseAttempt"("studentId", "exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_sessionEnrollmentId_idx" ON "ExerciseAttempt"("sessionEnrollmentId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_homeworkAssignmentId_idx" ON "ExerciseAttempt"("homeworkAssignmentId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_status_idx" ON "ExerciseAttempt"("status");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_submittedAt_idx" ON "ExerciseAttempt"("submittedAt");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_studentId_submittedAt_idx" ON "ExerciseAttempt"("studentId", "submittedAt");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_studentId_createdAt_idx" ON "ExerciseAttempt"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_centreId_studentId_status_idx" ON "HomeworkAssignment"("centreId", "studentId", "status");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_studentId_dueDate_idx" ON "HomeworkAssignment"("studentId", "dueDate");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_assignedById_idx" ON "HomeworkAssignment"("assignedById");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_courseId_idx" ON "HomeworkAssignment"("courseId");

-- CreateIndex
CREATE INDEX "HomeworkExercise_homeworkId_idx" ON "HomeworkExercise"("homeworkId");

-- CreateIndex
CREATE INDEX "HomeworkExercise_exerciseId_idx" ON "HomeworkExercise"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "HomeworkExercise_homeworkId_exerciseId_key" ON "HomeworkExercise"("homeworkId", "exerciseId");

-- CreateIndex
CREATE INDEX "AssessmentReview_assessorId_idx" ON "AssessmentReview"("assessorId");

-- CreateIndex
CREATE INDEX "AssessmentReview_exerciseAttemptId_idx" ON "AssessmentReview"("exerciseAttemptId");

-- CreateIndex
CREATE INDEX "AssessmentReview_physicalWorkUploadId_idx" ON "AssessmentReview"("physicalWorkUploadId");

-- CreateIndex
CREATE INDEX "AssessmentReview_status_idx" ON "AssessmentReview"("status");

-- CreateIndex
CREATE INDEX "AssessmentRubric_courseId_gradeLevelId_idx" ON "AssessmentRubric"("courseId", "gradeLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentRubric_courseId_gradeLevelId_exerciseType_name_key" ON "AssessmentRubric"("courseId", "gradeLevelId", "exerciseType", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalWorkUpload_qrCodeIdentifier_key" ON "PhysicalWorkUpload"("qrCodeIdentifier");

-- CreateIndex
CREATE INDEX "PhysicalWorkUpload_studentId_idx" ON "PhysicalWorkUpload"("studentId");

-- CreateIndex
CREATE INDEX "PhysicalWorkUpload_qrCodeIdentifier_idx" ON "PhysicalWorkUpload"("qrCodeIdentifier");

-- CreateIndex
CREATE INDEX "PhysicalWorkUpload_sessionEnrollmentId_idx" ON "PhysicalWorkUpload"("sessionEnrollmentId");

-- CreateIndex
CREATE INDEX "PhysicalWorkUpload_exerciseId_idx" ON "PhysicalWorkUpload"("exerciseId");

-- CreateIndex
CREATE INDEX "StudentSessionActivity_enrollmentId_idx" ON "StudentSessionActivity"("enrollmentId");

-- CreateIndex
CREATE INDEX "StudentSessionActivity_status_idx" ON "StudentSessionActivity"("status");

-- CreateIndex
CREATE INDEX "StudentSessionActivity_exerciseId_idx" ON "StudentSessionActivity"("exerciseId");

-- CreateIndex
CREATE INDEX "HelpRequest_sessionId_status_idx" ON "HelpRequest"("sessionId", "status");

-- CreateIndex
CREATE INDEX "HelpRequest_studentId_idx" ON "HelpRequest"("studentId");

-- CreateIndex
CREATE INDEX "HelpRequest_createdAt_idx" ON "HelpRequest"("createdAt");

-- CreateIndex
CREATE INDEX "HelpRequest_exerciseId_idx" ON "HelpRequest"("exerciseId");

-- CreateIndex
CREATE INDEX "HelpRequest_priority_idx" ON "HelpRequest"("priority");

-- CreateIndex
CREATE INDEX "HelpRequest_centreId_status_idx" ON "HelpRequest"("centreId", "status");

-- CreateIndex
CREATE INDEX "TutorNote_enrollmentId_idx" ON "TutorNote"("enrollmentId");

-- CreateIndex
CREATE INDEX "TutorNote_studentId_idx" ON "TutorNote"("studentId");

-- CreateIndex
CREATE INDEX "TutorNote_tutorId_idx" ON "TutorNote"("tutorId");

-- CreateIndex
CREATE INDEX "TutorNote_visibility_idx" ON "TutorNote"("visibility");

-- CreateIndex
CREATE INDEX "ContentAssignment_studentId_courseId_isActive_idx" ON "ContentAssignment"("studentId", "courseId", "isActive");

-- CreateIndex
CREATE INDEX "ContentAssignment_sessionEnrollmentId_idx" ON "ContentAssignment"("sessionEnrollmentId");

-- CreateIndex
CREATE INDEX "ContentAssignment_tutorId_idx" ON "ContentAssignment"("tutorId");

-- CreateIndex
CREATE INDEX "StudentGoal_studentId_idx" ON "StudentGoal"("studentId");

-- CreateIndex
CREATE INDEX "StudentGoal_isAchieved_idx" ON "StudentGoal"("isAchieved");

-- CreateIndex
CREATE INDEX "StudentStrengthWeakness_studentId_idx" ON "StudentStrengthWeakness"("studentId");

-- CreateIndex
CREATE INDEX "StudentStrengthWeakness_courseId_idx" ON "StudentStrengthWeakness"("courseId");

-- CreateIndex
CREATE INDEX "StudentStrengthWeakness_type_idx" ON "StudentStrengthWeakness"("type");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");

-- CreateIndex
CREATE INDEX "ChatMessage_recipientId_idx" ON "ChatMessage"("recipientId");

-- CreateIndex
CREATE INDEX "Award_centreId_isActive_idx" ON "Award"("centreId", "isActive");

-- CreateIndex
CREATE INDEX "Award_xpCost_idx" ON "Award"("xpCost");

-- CreateIndex
CREATE INDEX "AwardRedemption_studentId_idx" ON "AwardRedemption"("studentId");

-- CreateIndex
CREATE INDEX "AwardRedemption_awardId_idx" ON "AwardRedemption"("awardId");

-- CreateIndex
CREATE INDEX "AwardRedemption_redeemedAt_idx" ON "AwardRedemption"("redeemedAt");

-- CreateIndex
CREATE INDEX "AwardRedemption_status_idx" ON "AwardRedemption"("status");

-- CreateIndex
CREATE INDEX "SessionTemplate_tutorId_idx" ON "SessionTemplate"("tutorId");

-- CreateIndex
CREATE INDEX "SessionTemplate_centreId_idx" ON "SessionTemplate"("centreId");

-- CreateIndex
CREATE INDEX "SessionTemplate_dayOfWeek_idx" ON "SessionTemplate"("dayOfWeek");

-- CreateIndex
CREATE INDEX "SessionTemplate_isActive_idx" ON "SessionTemplate"("isActive");

-- CreateIndex
CREATE INDEX "ClassScheduleRule_classId_isActive_idx" ON "ClassScheduleRule"("classId", "isActive");

-- CreateIndex
CREATE INDEX "ClassScheduleRule_centreId_idx" ON "ClassScheduleRule"("centreId");

-- CreateIndex
CREATE INDEX "WhiteboardState_sessionId_idx" ON "WhiteboardState"("sessionId");

-- CreateIndex
CREATE INDEX "WhiteboardState_studentId_exerciseId_idx" ON "WhiteboardState"("studentId", "exerciseId");

-- CreateIndex
CREATE INDEX "WhiteboardState_centreId_idx" ON "WhiteboardState"("centreId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteboardState_sessionId_studentId_exerciseId_key" ON "WhiteboardState"("sessionId", "studentId", "exerciseId");

-- CreateIndex
CREATE INDEX "ActivityLog_enrollmentId_idx" ON "ActivityLog"("enrollmentId");

-- CreateIndex
CREATE INDEX "ActivityLog_timestamp_idx" ON "ActivityLog"("timestamp");

-- CreateIndex
CREATE INDEX "ActivityLog_centreId_idx" ON "ActivityLog"("centreId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "SessionPresenceLog_sessionId_studentId_idx" ON "SessionPresenceLog"("sessionId", "studentId");

-- CreateIndex
CREATE INDEX "SessionPresenceLog_enrollmentId_idx" ON "SessionPresenceLog"("enrollmentId");

-- CreateIndex
CREATE INDEX "SessionPresenceLog_timestamp_idx" ON "SessionPresenceLog"("timestamp");

-- CreateIndex
CREATE INDEX "SessionPresenceLog_centreId_idx" ON "SessionPresenceLog"("centreId");

-- CreateIndex
CREATE INDEX "VideoParticipant_sessionId_idx" ON "VideoParticipant"("sessionId");

-- CreateIndex
CREATE INDEX "VideoParticipant_userId_idx" ON "VideoParticipant"("userId");

-- CreateIndex
CREATE INDEX "VideoParticipant_participantId_idx" ON "VideoParticipant"("participantId");

-- CreateIndex
CREATE INDEX "VideoParticipant_sessionId_userId_idx" ON "VideoParticipant"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoRecording_recordingId_key" ON "VideoRecording"("recordingId");

-- CreateIndex
CREATE INDEX "VideoRecording_sessionId_idx" ON "VideoRecording"("sessionId");

-- CreateIndex
CREATE INDEX "VideoRecording_status_idx" ON "VideoRecording"("status");

-- CreateIndex
CREATE INDEX "VideoRecording_centreId_idx" ON "VideoRecording"("centreId");

-- CreateIndex
CREATE INDEX "VideoRecording_recordingId_idx" ON "VideoRecording"("recordingId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "ContentUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProfile" ADD CONSTRAINT "AcademicProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassCohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSessionEnrollment" ADD CONSTRAINT "StudentSessionEnrollment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSessionEnrollment" ADD CONSTRAINT "StudentSessionEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSessionEnrollment" ADD CONSTRAINT "StudentSessionEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSessionEnrollment" ADD CONSTRAINT "StudentSessionEnrollment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSessionEnrollment" ADD CONSTRAINT "StudentSessionEnrollment_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAttendance" ADD CONSTRAINT "SessionAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAttendance" ADD CONSTRAINT "SessionAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationProfile" ADD CONSTRAINT "GamificationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "GamificationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "GamificationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XPTransaction" ADD CONSTRAINT "XPTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeAward" ADD CONSTRAINT "BadgeAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeAward" ADD CONSTRAINT "BadgeAward_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "BadgeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardOptIn" ADD CONSTRAINT "LeaderboardOptIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassCohort" ADD CONSTRAINT "ClassCohort_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassCohort" ADD CONSTRAINT "ClassCohort_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMembership" ADD CONSTRAINT "ClassMembership_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMembership" ADD CONSTRAINT "ClassMembership_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchUpPackage" ADD CONSTRAINT "CatchUpPackage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchUpPackage" ADD CONSTRAINT "CatchUpPackage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchUpPackage" ADD CONSTRAINT "CatchUpPackage_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "AttendanceRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SLAConfig" ADD CONSTRAINT "SLAConfig_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePlan" ADD CONSTRAINT "FeePlan_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAccount" ADD CONSTRAINT "StudentAccount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAccount" ADD CONSTRAINT "StudentAccount_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentAccountId_fkey" FOREIGN KEY ("studentAccountId") REFERENCES "StudentAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_feePlanId_fkey" FOREIGN KEY ("feePlanId") REFERENCES "FeePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssessment" ADD CONSTRAINT "SubjectAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssessment" ADD CONSTRAINT "SubjectAssessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssessment" ADD CONSTRAINT "SubjectAssessment_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProfileLog" ADD CONSTRAINT "AcademicProfileLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProfileLog" ADD CONSTRAINT "AcademicProfileLog_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProfileLog" ADD CONSTRAINT "AcademicProfileLog_subjectAssessmentId_fkey" FOREIGN KEY ("subjectAssessmentId") REFERENCES "SubjectAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProfileLog" ADD CONSTRAINT "AcademicProfileLog_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProfileLog" ADD CONSTRAINT "AcademicProfileLog_assessmentReviewId_fkey" FOREIGN KEY ("assessmentReviewId") REFERENCES "AssessmentReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentUnit" ADD CONSTRAINT "ContentUnit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentUnit" ADD CONSTRAINT "ContentUnit_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "GradeLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_sessionEnrollmentId_fkey" FOREIGN KEY ("sessionEnrollmentId") REFERENCES "StudentSessionEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_homeworkAssignmentId_fkey" FOREIGN KEY ("homeworkAssignmentId") REFERENCES "HomeworkAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkAssignment" ADD CONSTRAINT "HomeworkAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkAssignment" ADD CONSTRAINT "HomeworkAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkAssignment" ADD CONSTRAINT "HomeworkAssignment_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkAssignment" ADD CONSTRAINT "HomeworkAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkAssignment" ADD CONSTRAINT "HomeworkAssignment_sessionEnrollmentId_fkey" FOREIGN KEY ("sessionEnrollmentId") REFERENCES "StudentSessionEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkExercise" ADD CONSTRAINT "HomeworkExercise_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "HomeworkAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkExercise" ADD CONSTRAINT "HomeworkExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentReview" ADD CONSTRAINT "AssessmentReview_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentReview" ADD CONSTRAINT "AssessmentReview_exerciseAttemptId_fkey" FOREIGN KEY ("exerciseAttemptId") REFERENCES "ExerciseAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentReview" ADD CONSTRAINT "AssessmentReview_physicalWorkUploadId_fkey" FOREIGN KEY ("physicalWorkUploadId") REFERENCES "PhysicalWorkUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentReview" ADD CONSTRAINT "AssessmentReview_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "AssessmentRubric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRubric" ADD CONSTRAINT "AssessmentRubric_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRubric" ADD CONSTRAINT "AssessmentRubric_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "GradeLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalWorkUpload" ADD CONSTRAINT "PhysicalWorkUpload_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalWorkUpload" ADD CONSTRAINT "PhysicalWorkUpload_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalWorkUpload" ADD CONSTRAINT "PhysicalWorkUpload_sessionEnrollmentId_fkey" FOREIGN KEY ("sessionEnrollmentId") REFERENCES "StudentSessionEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalWorkUpload" ADD CONSTRAINT "PhysicalWorkUpload_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSessionActivity" ADD CONSTRAINT "StudentSessionActivity_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentSessionEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSessionActivity" ADD CONSTRAINT "StudentSessionActivity_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentSessionEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorNote" ADD CONSTRAINT "TutorNote_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentSessionEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorNote" ADD CONSTRAINT "TutorNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorNote" ADD CONSTRAINT "TutorNote_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorNote" ADD CONSTRAINT "TutorNote_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_sessionEnrollmentId_fkey" FOREIGN KEY ("sessionEnrollmentId") REFERENCES "StudentSessionEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGoal" ADD CONSTRAINT "StudentGoal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStrengthWeakness" ADD CONSTRAINT "StudentStrengthWeakness_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStrengthWeakness" ADD CONSTRAINT "StudentStrengthWeakness_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStrengthWeakness" ADD CONSTRAINT "StudentStrengthWeakness_identifiedBy_fkey" FOREIGN KEY ("identifiedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardRedemption" ADD CONSTRAINT "AwardRedemption_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardRedemption" ADD CONSTRAINT "AwardRedemption_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "Award"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTemplate" ADD CONSTRAINT "SessionTemplate_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTemplate" ADD CONSTRAINT "SessionTemplate_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassScheduleRule" ADD CONSTRAINT "ClassScheduleRule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteboardState" ADD CONSTRAINT "WhiteboardState_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteboardState" ADD CONSTRAINT "WhiteboardState_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteboardState" ADD CONSTRAINT "WhiteboardState_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentSessionEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPresenceLog" ADD CONSTRAINT "SessionPresenceLog_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPresenceLog" ADD CONSTRAINT "SessionPresenceLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPresenceLog" ADD CONSTRAINT "SessionPresenceLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPresenceLog" ADD CONSTRAINT "SessionPresenceLog_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentSessionEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoParticipant" ADD CONSTRAINT "VideoParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoParticipant" ADD CONSTRAINT "VideoParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoRecording" ADD CONSTRAINT "VideoRecording_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoRecording" ADD CONSTRAINT "VideoRecording_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

