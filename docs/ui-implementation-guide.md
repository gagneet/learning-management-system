# Phase 1 UI Implementation Guide

## Overview
This guide provides patterns and best practices for implementing the 27+ UI pages needed for Phase 1 of the LMS.

## Core UI Principles

### 1. Authentication & Authorization
All pages should:
- Use Next.js 13+ App Router with Server Components
- Check authentication via `auth()` from `@/lib/auth`
- Redirect to login if not authenticated
- Check permissions and show role-appropriate UI

### 2. Responsive Design
- Mobile-first approach
- Use Tailwind CSS classes
- Support dark mode (future)
- Accessible (ARIA labels, keyboard navigation)

### 3. Loading States
- Show skeleton loaders during data fetch
- Use Suspense boundaries where appropriate
- Provide feedback for all actions

### 4. Error Handling
- Graceful error messages
- Retry mechanisms where appropriate
- Toast notifications for actions

## Standard Page Template

### Server Component (Data Fetching)
```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";

export default async function ResourcePage() {
  // 1. Authenticate
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  // 2. Check permissions
  if (!hasPermission(session, Permissions.RESOURCE_VIEW)) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }

  // 3. Fetch data (server-side)
  const resources = await prisma.resource.findMany({
    where: {
      centreId: session.user.centreId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  // 4. Render UI
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Resources</h1>
        {hasPermission(session, Permissions.RESOURCE_CREATE) && (
          <CreateResourceButton />
        )}
      </div>

      <ResourceList resources={resources} />
    </div>
  );
}
```

### Client Component (Interactive Elements)
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Resource {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
}

export function ResourceList({ resources }: { resources: Resource[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      alert("Error deleting resource");
    } finally {
      setLoading(false);
    }
  };

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No resources found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {resources.map((resource) => (
        <div
          key={resource.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{resource.name}</h3>
              <p className="text-sm text-gray-500">
                Created: {new Date(resource.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/resources/${resource.id}`)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View
              </button>
              <button
                onClick={() => handleDelete(resource.id)}
                disabled={loading}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Form Component
```typescript
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CreateResourceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      status: formData.get("status"),
    };

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create resource");
      }

      // Success - redirect to list
      router.push("/resources");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Resource"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

## Specific Page Implementations

### Dashboard - Tutor/Teacher My Day Page

**Location:** `app/dashboard/tutor/page.tsx`

**Key Features:**
- Show today's sessions
- Pending attendance marking
- Quick stats (total classes, students, completion rate)
- Quick actions (mark attendance, view class)

**Implementation:**
```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasAnyRole } from "@/lib/rbac";

export default async function TutorDashboard() {
  const session = await auth();
  if (!session || !hasAnyRole(session, ["TEACHER", "SUPER_ADMIN", "CENTER_ADMIN"])) {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch today's sessions
  const todaySessions = await prisma.session.findMany({
    where: {
      startDate: {
        gte: today,
        lt: tomorrow,
      },
      classCohort: {
        teacherId: session.user.id,
      },
    },
    include: {
      classCohort: {
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
      attendanceRecords: true,
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  // Get pending attendance (sessions in past without full attendance)
  const pendingAttendance = todaySessions.filter(
    (s) => s.startDate < new Date() && s.attendanceRecords.length < (s.classCohort._count.members || 0)
  );

  // Get statistics
  const stats = await prisma.classCohort.aggregate({
    where: {
      teacherId: session.user.id,
      status: "ACTIVE",
    },
    _count: true,
  });

  const totalStudents = await prisma.classMembership.count({
    where: {
      classCohort: {
        teacherId: session.user.id,
        status: "ACTIVE",
      },
      status: "ACTIVE",
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Day</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatsCard title="Active Classes" value={stats._count} />
        <StatsCard title="Total Students" value={totalStudents} />
        <StatsCard title="Today's Sessions" value={todaySessions.length} />
      </div>

      {/* Pending Attendance Alert */}
      {pendingAttendance.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">
            ⚠️ Pending Attendance
          </h3>
          <p className="text-yellow-700">
            You have {pendingAttendance.length} session(s) with incomplete attendance records.
          </p>
        </div>
      )}

      {/* Today's Sessions */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Today's Sessions</h2>
        {todaySessions.length === 0 ? (
          <p className="text-gray-500">No sessions scheduled for today.</p>
        ) : (
          <div className="grid gap-4">
            {todaySessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

### Attendance Marking Page

**Location:** `app/classes/[id]/attendance/page.tsx`

**Key Features:**
- List all students in class
- Mark attendance status (Present/Absent/Late)
- Add notes
- Auto-generate catch-ups for absent students

**Implementation:**
```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AttendanceForm } from "@/components/AttendanceForm";

export default async function AttendancePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  // Fetch class with members
  const classCohort = await prisma.classCohort.findUnique({
    where: { id: params.id },
    include: {
      members: {
        where: {
          status: "ACTIVE",
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      sessions: {
        where: {
          startDate: {
            lte: new Date(),
          },
        },
        orderBy: {
          startDate: 'desc',
        },
        take: 10,
      },
    },
  });

  if (!classCohort) {
    return <div>Class not found</div>;
  }

  // Check if user is teacher of this class
  if (session.user.role === "TEACHER" && classCohort.teacherId !== session.user.id) {
    return <div>Access denied</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{classCohort.name}</h1>
      <p className="text-gray-600 mb-6">{classCohort.subject}</p>

      <AttendanceForm
        classId={params.id}
        students={classCohort.members.map((m) => m.student)}
        sessions={classCohort.sessions}
      />
    </div>
  );
}
```

### Student Catch-Up Queue Page

**Location:** `app/catchups/page.tsx`

**Key Features:**
- Show pending catch-ups
- Due date prominently displayed
- Resources available
- Mark as complete

**Implementation:**
```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CatchUpCard } from "@/components/CatchUpCard";

export default async function CatchUpsPage() {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  // Fetch student's catch-ups
  const catchUps = await prisma.catchUpPackage.findMany({
    where: {
      studentId: session.user.id,
      status: {
        in: ["PENDING", "IN_PROGRESS", "OVERDUE"],
      },
    },
    include: {
      attendanceRecord: {
        include: {
          session: {
            include: {
              classCohort: {
                select: {
                  name: true,
                  subject: true,
                  teacher: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [
      { status: 'asc' }, // PENDING/IN_PROGRESS before OVERDUE
      { dueDate: 'asc' }, // Soonest due first
    ],
  });

  const overdue = catchUps.filter((c) => c.status === "OVERDUE");
  const pending = catchUps.filter((c) => c.status === "PENDING" || c.status === "IN_PROGRESS");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Catch-Up Work</h1>

      {overdue.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            ⚠️ Overdue ({overdue.length})
          </h2>
          <div className="grid gap-4">
            {overdue.map((catchUp) => (
              <CatchUpCard key={catchUp.id} catchUp={catchUp} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="text-center py-12 bg-green-50 rounded-lg">
            <p className="text-green-700 text-lg">🎉 All caught up! Great work!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pending.map((catchUp) => (
              <CatchUpCard key={catchUp.id} catchUp={catchUp} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

### Finance - Invoice List Page

**Location:** `app/finance/invoices/page.tsx`

**Key Features:**
- List invoices with filters (status, date range)
- Show totals and payment status
- Create new invoice button (for admins)
- Export to PDF/CSV

### Governance - Audit Log Viewer

**Location:** `app/admin/audit/page.tsx`

**Key Features:**
- Search by user, date, action, resource
- Paginated results
- Drill-down to see before/after state
- Export functionality

## Reusable Components

### ClickableCard Component
```typescript
"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface ClickableCardProps {
  href?: string;
  onClick?: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: string;
  className?: string;
}

export function ClickableCard({
  href,
  onClick,
  title,
  description,
  icon,
  badge,
  className = "",
}: ClickableCardProps) {
  const content = (
    <div
      className={`
        border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer
        hover:border-blue-500 bg-white ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {icon && <div className="mb-3">{icon}</div>}
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
        {badge && (
          <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
            {badge}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
```

### Footer Component
```typescript
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-blue-400 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="hover:text-blue-400 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-blue-400 transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/api" className="hover:text-blue-400 transition-colors">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/gdpr" className="hover:text-blue-400 transition-colors">
                  GDPR Compliance
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Learning Management System. All rights reserved.</p>
          <p className="mt-2 text-sm">
            All actions are logged for security and compliance. 
            <Link href="/privacy" className="text-blue-400 hover:underline ml-1">
              Learn more about our audit trail
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
```

## Layout Updates

### Root Layout with Footer
```typescript
// app/layout.tsx
import { Footer } from "@/components/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

## Accessibility Checklist

For each page/component, ensure:
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Buttons have aria-labels for icons
- [ ] Color contrast meets WCAG AA standards
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Screen reader compatible

## Testing Checklist

For each UI page, test:
- [ ] Displays correctly on mobile (375px)
- [ ] Displays correctly on tablet (768px)
- [ ] Displays correctly on desktop (1280px+)
- [ ] Loading states work
- [ ] Error states work
- [ ] Empty states work
- [ ] Actions trigger correct API calls
- [ ] Permissions hide/show appropriate elements
- [ ] Forms validate input
- [ ] Success/error messages display

## Next Steps

1. **Pick a page to implement** from the checklist
2. **Use server components** for data fetching when possible
3. **Extract reusable components** to avoid duplication
4. **Add loading.tsx** and **error.tsx** for better UX
5. **Test on multiple devices** and screen sizes
6. **Document any custom components** created

## Reference Files

- `app/dashboard/student/page.tsx` - Example dashboard
- `app/login/page.tsx` - Example form page
- `app/courses/page.tsx` - Example list page
- `lib/auth.ts` - Authentication helpers
