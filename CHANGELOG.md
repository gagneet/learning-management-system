# Changelog

All notable changes to the LMS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-02-13

### Added - Session Planner (Phase 1.2)

#### Calendar-Based Session Planning
- **Week Calendar View**: Visual 7-day calendar grid with session cards
  - Color-coded session status (COMPLETED, SCHEDULED, DRAFT, CANCELLED, LIVE)
  - Navigate forward/backward by week
  - Quick session creation from empty days
  - Today highlight with blue accent
  - Status legend for clarity

- **Multi-Step Planning Form** (6-step wizard, 3 functional in MVP)
  - **Step 1: Basic Details**
    - Date picker with time selection
    - Duration auto-calculation
    - Session type (Individual, Group, Workshop)
    - Course/subject selection
  - **Step 2: Student Selection**
    - Grid of student cards with context
    - Multi-select with checkboxes
    - Student performance and goals display
    - Selected count in header
  - **Step 3: Content Planning**
    - AI-recommended exercises (top 3)
    - Exercise metadata (type, difficulty, time)
    - One-click exercise addition
    - Selected exercises list with remove option
  - **Steps 4-6**: Placeholders for Phase 2
    - Session Structure (timeline builder)
    - Resources & Materials
    - Objectives & Notes

- **Session Creation Integration**
  - Creates session via `/api/sessions/create`
  - Auto-generates session title from course + type
  - Assigns selected students to session
  - Creates homework assignments for exercises
  - Refreshes calendar after creation
  - Error handling with user feedback

- **Dashboard Features**
  - Quick stats cards (upcoming sessions, students, courses)
  - Planning tips section
  - Easy navigation to/from sessions list

#### Components Created
- `CalendarView.tsx` - Week calendar with session cards (349 lines)
- `SessionPlanningForm.tsx` - Multi-step planning wizard (572 lines)

#### Routes Created
- `/dashboard/tutor/planner` - Session planning interface
  - Server component for data fetching (132 lines)
  - Client orchestrator component (230 lines)

### Changed

- **Sessions List Page**: Added "📅 Session Planner" button for easy access

### Technical Implementation

- **Architecture**: Server Components for data fetching, Client Components for interactivity
- **API Integration**: Uses existing session creation and homework APIs
- **Type Safety**: Full TypeScript with interfaces and type guards
- **Responsive Design**: Mobile-first with Tailwind CSS breakpoints
- **State Management**: React useState for form and calendar state
- **Data Flow**: Server → Client with prop passing and router.refresh()

### Documentation

- `SESSION_PLANNER_IMPLEMENTATION_SUMMARY.md` - Complete implementation summary (502 lines)
- `SESSION_PLANNER_UX_DESIGN.md` - Comprehensive UX/UI design document (1,478 lines)
- `DEPLOYMENT-2026-02-13-PHASE-1.1.md` - Deployment record

### Known Limitations (Phase 2 Roadmap)

- Steps 4-6 not implemented (Structure, Resources, Objectives)
- Month view not functional (only week view)
- Template library not implemented
- Cannot edit existing sessions (create only)
- Basic AI recommendations (not data-driven)

---

## [1.1.0] - 2026-02-13

### Added - Phase 1 Individualized Tutoring Platform (Completion)

#### Tutor Session Dashboard (Real-Time)
- **Live Session Management**: Real-time dashboard for managing multi-student sessions
  - Session timer with live elapsed time tracking
  - Session status controls (Start, Pause, End)
  - Active students count display
  - Status indicators (LIVE, SCHEDULED, COMPLETED)

- **Help Request System Integration**
  - Priority-based help queue (URGENT, HIGH, MEDIUM, LOW)
  - Color-coded priority indicators
  - Acknowledge and resolve actions
  - Auto-update student status on resolution
  - Collapsible panel for space efficiency

- **Student Grid Monitoring**
  - Responsive grid layout (1-4 columns based on screen size)
  - Real-time status indicators:
    - 🟢 WORKING (Green)
    - 🔴 WAITING_HELP (Red)
    - ✅ COMPLETED (Blue)
    - ⏸️ IDLE (Yellow)
    - ⚪ NOT_STARTED (Gray)
  - Visual progress bars (0-100%)
  - Current exercise display
  - Quick action buttons (Notes, Assign content)

- **Student Detail Sidebar** (4-tab interface)
  - **Profile Tab**: Academic profile, goals with progress, recent assessments
  - **Activity Tab**: Session timeline, exercise history with scores
  - **Content Tab**: AI-recommended exercises with one-click assignment
  - **Notes Tab**: Create session notes with visibility controls (Internal/External)

- **Session Action Bar**
  - Generate session report
  - Mark attendance
  - Broadcast messaging (placeholder)
  - End session with confirmation

#### Components Created
- `SessionHeader.tsx` - Header with timer and controls (142 lines)
- `HelpRequestPanel.tsx` - Priority-based help queue (211 lines)
- `StudentGridView.tsx` - Student card grid with status (161 lines)
- `StudentDetailSidebar.tsx` - 4-tab detail view (401 lines)
- `SessionActionBar.tsx` - Bottom action bar (50 lines)

#### Routes Created
- `/dashboard/tutor/sessions/[id]/live` - Real-time session dashboard
  - Server component for data fetching (168 lines)
  - Client component for real-time UI (358 lines)

#### UX/UI Design Documentation
- `TUTOR_SESSION_DASHBOARD_UX_DESIGN.md` - Comprehensive design doc (787 lines)
- `SESSION_PLANNER_UX_DESIGN.md` - Session planning design doc (1,478 lines)

### Changed

- **Sessions List Page**: Added "Go Live" button to navigate to live dashboard
- **Session Status Updates**: Integrated with existing session API (`PUT /api/sessions/[sessionId]`)

### Technical Improvements

- **Type Safety**: Full TypeScript implementation with strict mode
- **Responsive Design**: Desktop (4 col) → Laptop (3 col) → Tablet (2 col) → Mobile (1 col)
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation
- **Performance**: Optimistic UI updates, debounced polling (5s interval)
- **Build**: All routes compiled successfully (72 total routes)

### Integration

- Uses existing Phase 1 APIs:
  - `PUT /api/sessions/[sessionId]` - Update session status
  - `PATCH /api/v1/help-requests/[id]` - Manage help requests
  - `POST /api/v1/tutor-notes` - Create session notes
  - `POST /api/v1/homework` - Assign content

### Documentation

- `TUTOR_DASHBOARD_IMPLEMENTATION_SUMMARY.md` - Complete implementation summary
- Updated `CLAUDE.md` with new routes and features

---

## [1.0.0] - 2026-02-12

### Added - Phase 1 Individualized Tutoring Platform (Initial Release)

#### Schema Enhancements
- **HelpRequest Model**: Added priority field (LOW, MEDIUM, HIGH, URGENT), IN_PROGRESS status, exerciseId, responseText
- **HomeworkAssignment Model**: Added totalMaxScore, totalScore, gradedById, feedback, multi-exercise support via junction table
- **HomeworkExercise Junction Table**: Many-to-many relationship for homework with multiple exercises
- **AwardRedemption Model**: Added status field (PENDING, FULFILLED, REJECTED)

#### API Endpoints (18 routes)
- **Awards System** (`/api/v1/awards`)
  - List all awards
  - Create new award (TEACHER+)
  - Get award details
  - Update award (TEACHER+)
  - Redeem award (STUDENT+)
  - List redemptions
  - Get redemption details

- **Exercise System** (`/api/v1/exercises`)
  - Get exercise details
  - Start exercise attempt
  - Submit exercise answers

- **Homework System** (`/api/v1/homework`)
  - List homework assignments
  - Create homework (TEACHER+)
  - Get homework details
  - Update/grade homework (TEACHER+)

- **Help Request System** (`/api/v1/help-requests`)
  - List help requests
  - Create help request (STUDENT+)
  - Get help request details
  - Update help request status (TEACHER+)

- **Student Goals** (`/api/v1/student-goals`)
  - List student goals
  - Create goal (TEACHER+, STUDENT)
  - Get goal details
  - Update goal (TEACHER+, STUDENT)

- **Tutor Notes** (`/api/v1/tutor-notes`)
  - List tutor notes
  - Create note (TEACHER+)
  - Get note details
  - Update note (TEACHER+)

- **Assessment System** (`/api/v1/students/[id]/assessments`)
  - List student assessments
  - Create assessment (TEACHER+)
  - Update assessment (TEACHER+)

- **Content Auto-Sequencing** (`/api/v1/students/[id]/next-content`)
  - Get recommended next content

### Technical

- **Database**: PostgreSQL with Prisma ORM v5.22.0
- **Framework**: Next.js 16.1.6 with Turbopack
- **Authentication**: NextAuth v5 with role-based access control
- **Build**: Production build successful (71 routes)
- **Deployment**: PM2 cluster mode (4 instances on port 3001)

### Testing

- Schema verification: 5/5 passed
- Seed data verification: 8/8 passed
- Data integrity checks: 4/5 passed (1 expected skip)
- API endpoint tests: 14/14 passed

### Documentation

- `DEPLOYMENT_SUMMARY.md` - Complete Phase 1 deployment documentation
- `TEST_RESULTS.md` - Comprehensive test results
- `IMPLEMENTATION-SUMMARY-2026-02-12.md` - Implementation details
- Updated `CLAUDE.md` with Phase 1 API structure

---

## [0.9.0] - 2026-02-11

### Added - Multi-Tenancy & RBAC Foundation

#### Core Features
- Multi-tenancy architecture (center-based isolation)
- 7-tier role-based access control (RBAC)
- User management system
- Course hierarchy (Course → Module → Lesson → Content)
- Gamification system (XP, badges, achievements)
- Financial tracking (fees, payments, reports)
- Live session integration (Teams, Zoom, Chime)

#### Authentication & Authorization
- NextAuth v5 credentials provider
- Session-based authentication
- Center-based data isolation
- HTTPS redirect middleware

### Technical

- **Stack**: Next.js 16, React 19, TypeScript, Prisma, PostgreSQL
- **Styling**: Tailwind CSS v3
- **Process Manager**: PM2 cluster mode
- **Deployment**: CloudFlare Tunnel + Nginx reverse proxy

### Documentation

- Initial `CLAUDE.md` project documentation
- `README.md` with setup instructions
- `docs/api.md` with endpoint documentation
- `docs/features.md` with feature inventory

---

[Unreleased]: https://github.com/yourusername/lms/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/yourusername/lms/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yourusername/lms/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/yourusername/lms/releases/tag/v0.9.0
