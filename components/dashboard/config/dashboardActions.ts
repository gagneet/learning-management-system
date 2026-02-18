import {
  BookOpen,
  Calendar,
  Trophy,
  FileText,
  MessageCircle,
  Target,
  ClipboardList,
  Users,
  PlusCircle,
  BarChart3,
  DollarSign,
  Settings,
  Building2,
  GraduationCap,
  Award,
  CalendarPlus,
  BookMarked,
  CalendarDays,
  History,
  Library,
  ClipboardCheck,
  PackageOpen,
  LayoutList,
} from "lucide-react";
import { Role } from "@prisma/client";
import { ActionCard } from "../ActionCardsSection";
import { createElement } from "react";

interface ActionContext {
  todaySessionsCount?: number;
  pendingLessonsCount?: number;
  gamificationLevel?: number;
  markingQueueCount?: number;
  helpRequestsCount?: number;
  pendingTransactionsCount?: number;
  activeStudentsCount?: number;
}

/**
 * Get action cards for a specific user role
 * @param role - User role from Prisma schema
 * @param context - Dynamic context for badges (counts, levels, etc.)
 * @returns Array of action cards for the role
 */
export function getActionCardsForRole(
  role: Role,
  context: ActionContext = {}
): ActionCard[] {
  switch (role) {
    case "STUDENT":
      return [
        {
          title: "Browse Courses",
          description: "Explore and enroll in new courses",
          icon: createElement(BookOpen, { className: "w-6 h-6" }),
          href: "/courses",
        },
        {
          title: "My Sessions",
          description: "View upcoming live sessions",
          icon: createElement(Calendar, { className: "w-6 h-6" }),
          href: "/dashboard/student/sessions",
          badge: context.todaySessionsCount
            ? `Today: ${context.todaySessionsCount}`
            : undefined,
        },
        {
          title: "My Achievements",
          description: "View badges and leaderboard",
          icon: createElement(Trophy, { className: "w-6 h-6" }),
          href: "/dashboard/student/gamification",
          badge: context.gamificationLevel
            ? `Level ${context.gamificationLevel}`
            : undefined,
        },
        {
          title: "Homework",
          description: "Complete pending assignments",
          icon: createElement(FileText, { className: "w-6 h-6" }),
          href: "/dashboard/student/homework",
          badge: context.pendingLessonsCount
            ? `${context.pendingLessonsCount} pending`
            : undefined,
        },
        {
          title: "Request Help",
          description: "Get assistance from a tutor",
          icon: createElement(MessageCircle, { className: "w-6 h-6" }),
          href: "/dashboard/student/help",
        },
        {
          title: "My Goals",
          description: "Track your learning goals",
          icon: createElement(Target, { className: "w-6 h-6" }),
          href: "/dashboard/student/goals",
        },
        {
          title: "Catch-ups",
          description: "Review missed session materials",
          icon: createElement(PackageOpen, { className: "w-6 h-6" }),
          href: "/dashboard/student/catchups",
        },
      ];

    case "TEACHER":
      return [
        {
          title: "My Day",
          description: "Today's schedule and students",
          icon: createElement(CalendarDays, { className: "w-6 h-6" }),
          href: "/dashboard/tutor/my-day",
        },
        {
          title: "Plan Session",
          description: "Create a new session plan",
          icon: createElement(CalendarPlus, { className: "w-6 h-6" }),
          href: "/dashboard/tutor/planner",
        },
        {
          title: "My Students",
          description: "View and manage students",
          icon: createElement(Users, { className: "w-6 h-6" }),
          href: "/dashboard/tutor/students",
          badge: context.activeStudentsCount
            ? `${context.activeStudentsCount} active`
            : undefined,
        },
        {
          title: "Create Course",
          description: "Build a new course",
          icon: createElement(PlusCircle, { className: "w-6 h-6" }),
          href: "/admin/courses/new",
        },
        {
          title: "Marking Queue",
          description: "Grade pending submissions",
          icon: createElement(ClipboardList, { className: "w-6 h-6" }),
          href: "/dashboard/tutor/marking",
          badge: context.markingQueueCount
            ? `${context.markingQueueCount} pending`
            : undefined,
        },
        {
          title: "All Sessions",
          description: "View all scheduled sessions",
          icon: createElement(Calendar, { className: "w-6 h-6" }),
          href: "/dashboard/tutor/sessions",
        },
        {
          title: "Resources",
          description: "Access teaching materials",
          icon: createElement(BookMarked, { className: "w-6 h-6" }),
          href: "/dashboard/tutor/resources",
        },
        {
          title: "Session History",
          description: "View past session records",
          icon: createElement(History, { className: "w-6 h-6" }),
          href: "/dashboard/tutor/history",
        },
        {
          title: "Content Library",
          description: "Manage teaching materials",
          icon: createElement(Library, { className: "w-6 h-6" }),
          href: "/dashboard/tutor/content-library",
        },
        {
          title: "Create Assessment",
          description: "Build assessment for students",
          icon: createElement(ClipboardCheck, { className: "w-6 h-6" }),
          href: "/dashboard/tutor/assessments/create",
        },
        {
          title: "Catch-up Packages",
          description: "Manage student catch-up materials",
          icon: createElement(PackageOpen, { className: "w-6 h-6" }),
          href: "/dashboard/tutor/catchups",
        },
      ];

    case "CENTER_SUPERVISOR":
    case "CENTER_ADMIN":
      return [
        {
          title: "Financial Reports",
          description: "View revenue and expenses",
          icon: createElement(DollarSign, { className: "w-6 h-6" }),
          href: "/dashboard/supervisor/financial",
        },
        {
          title: "Student Analytics",
          description: "Track student performance",
          icon: createElement(BarChart3, { className: "w-6 h-6" }),
          href: "/dashboard/supervisor/analytics",
        },
        {
          title: "Manage Users",
          description: "Add and edit staff/students",
          icon: createElement(Users, { className: "w-6 h-6" }),
          href: "/admin/users",
        },
        {
          title: "Attendance",
          description: "Monitor attendance trends",
          icon: createElement(Calendar, { className: "w-6 h-6" }),
          href: "/dashboard/supervisor/attendance",
        },
        {
          title: "Tutor Performance",
          description: "Review tutor metrics",
          icon: createElement(GraduationCap, { className: "w-6 h-6" }),
          href: "/dashboard/supervisor/tutors",
        },
        {
          title: "Transactions",
          description: "View payment history",
          icon: createElement(FileText, { className: "w-6 h-6" }),
          href: "/dashboard/supervisor/transactions",
          badge: context.pendingTransactionsCount
            ? `${context.pendingTransactionsCount} pending`
            : undefined,
        },
        {
          title: "Classes",
          description: "Manage class cohorts and schedules",
          icon: createElement(LayoutList, { className: "w-6 h-6" }),
          href: "/admin/classes",
        },
      ];

    case "FINANCE_ADMIN":
      return [
        {
          title: "Financial Dashboard",
          description: "View all financial metrics",
          icon: createElement(DollarSign, { className: "w-6 h-6" }),
          href: "/dashboard/supervisor/financial",
        },
        {
          title: "Transactions",
          description: "Manage payments and refunds",
          icon: createElement(FileText, { className: "w-6 h-6" }),
          href: "/dashboard/supervisor/transactions",
          badge: context.pendingTransactionsCount
            ? `${context.pendingTransactionsCount} pending`
            : undefined,
        },
        {
          title: "Reports",
          description: "Generate financial reports",
          icon: createElement(BarChart3, { className: "w-6 h-6" }),
          href: "/dashboard/supervisor/reports",
        },
        {
          title: "Student Fees",
          description: "View student payment status",
          icon: createElement(Users, { className: "w-6 h-6" }),
          href: "/dashboard/supervisor/fees",
        },
        {
          title: "Tutor Payments",
          description: "Process tutor compensation",
          icon: createElement(GraduationCap, { className: "w-6 h-6" }),
          href: "/dashboard/supervisor/tutor-payments",
        },
        {
          title: "Budget",
          description: "Monitor operational costs",
          icon: createElement(ClipboardList, { className: "w-6 h-6" }),
          href: "/dashboard/supervisor/budget",
        },
      ];

    case "SUPER_ADMIN":
      return [
        {
          title: "Manage Centers",
          description: "View and configure centers",
          icon: createElement(Building2, { className: "w-6 h-6" }),
          href: "/admin/centers",
        },
        {
          title: "All Users",
          description: "Manage users across centers",
          icon: createElement(Users, { className: "w-6 h-6" }),
          href: "/admin/users",
        },
        {
          title: "System Analytics",
          description: "View platform-wide metrics",
          icon: createElement(BarChart3, { className: "w-6 h-6" }),
          href: "/admin/analytics",
        },
        {
          title: "All Courses",
          description: "Browse courses across centers",
          icon: createElement(BookOpen, { className: "w-6 h-6" }),
          href: "/admin/courses",
        },
        {
          title: "System Settings",
          description: "Configure platform settings",
          icon: createElement(Settings, { className: "w-6 h-6" }),
          href: "/admin/settings",
        },
        {
          title: "Awards System",
          description: "Manage gamification rewards",
          icon: createElement(Award, { className: "w-6 h-6" }),
          href: "/admin/awards",
        },
        {
          title: "Classes",
          description: "Manage class cohorts across centers",
          icon: createElement(LayoutList, { className: "w-6 h-6" }),
          href: "/admin/classes",
        },
      ];

    case "PARENT":
      return [
        {
          title: "Children's Progress",
          description: "View academic performance",
          icon: createElement(BarChart3, { className: "w-6 h-6" }),
          href: "/dashboard/parent/progress",
        },
        {
          title: "Upcoming Sessions",
          description: "View children's schedules",
          icon: createElement(Calendar, { className: "w-6 h-6" }),
          href: "/dashboard/parent/sessions",
          badge: context.todaySessionsCount
            ? `Today: ${context.todaySessionsCount}`
            : undefined,
        },
        {
          title: "Assignments",
          description: "Check homework status",
          icon: createElement(FileText, { className: "w-6 h-6" }),
          href: "/dashboard/parent/homework",
        },
        {
          title: "Achievements",
          description: "View badges and rewards",
          icon: createElement(Trophy, { className: "w-6 h-6" }),
          href: "/dashboard/parent/achievements",
        },
        {
          title: "Payments",
          description: "View payment history",
          icon: createElement(DollarSign, { className: "w-6 h-6" }),
          href: "/dashboard/parent/payments",
        },
        {
          title: "Messages",
          description: "Contact teachers",
          icon: createElement(MessageCircle, { className: "w-6 h-6" }),
          href: "/dashboard/parent/messages",
        },
      ];

    default:
      return [];
  }
}
