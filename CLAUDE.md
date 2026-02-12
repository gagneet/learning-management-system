# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Learning Management System (LMS)** built with Next.js 16, React 19, TypeScript, Prisma, and PostgreSQL. The system supports multi-tenancy (multiple learning centers), role-based access control, course management with hierarchical structure, gamification, financial tracking, and live session integration.

**Production URL**: https://lms.gagneet.com

## Core Commands

### Development
```bash
npm run dev           # Start development server (localhost:3000)
npm run build         # Build for production
npm start             # Start production server (port 3001 in PM2)
npm run lint          # Run ESLint
```

### Database Operations
```bash
npm run db:generate   # Generate Prisma client (run after schema changes)
npm run db:push       # Push schema changes to database (no migrations)
npm run db:seed       # Seed database with sample data
npx prisma studio     # Open Prisma Studio for database GUI
```

### Production Deployment
```bash
./scripts/build-and-deploy.sh        # Automated deployment with backup & rollback
./scripts/rollback.sh                # Rollback to previous version
./scripts/rollback.sh latest         # Rollback to latest backup
./scripts/health-check.sh            # Check application health
./scripts/database-setup.sh          # Initial database setup
./scripts/generate-env-production.sh # Generate production .env file
```

### PM2 Process Management
```bash
pm2 start ecosystem.config.cjs --env production  # Start application
pm2 restart lms-nextjs                           # Restart application
pm2 stop lms-nextjs                              # Stop application
pm2 logs lms-nextjs                              # View logs
pm2 monit                                        # Monitor resources
```

**Important:** After running `npm run build`, always restart PM2 to load the new build:
```bash
npm run build && pm2 restart lms-nextjs
```

Or use the automated deployment script which handles this:
```bash
./scripts/build-and-deploy.sh
```

## Architecture

### Multi-Tenancy Model
The system uses a **center-based multi-tenancy** architecture where each center is an isolated tenant:
- All users belong to a center (except SUPER_ADMIN who can access all)
- Courses, enrollments, and most data are scoped to a center
- Course slugs are unique per center, not globally
- API endpoints enforce center-based data isolation

### Authentication & Authorization
- **Authentication**: NextAuth.js v5 with credentials provider
- **Session Storage**: User sessions include `id`, `role`, `centerId`, `centerName`
- **Password Hashing**: bcrypt with 10 salt rounds
- **Auth Configuration**: `lib/auth.ts`

### User Roles (7-tier RBAC)
1. **SUPER_ADMIN**: Full system access across all centers
2. **CENTER_ADMIN**: Administrative control within their center
3. **CENTER_SUPERVISOR**: Supervisory access within their center
4. **FINANCE_ADMIN**: Financial management and billing oversight within their center
5. **TEACHER**: Course creation and student management
6. **PARENT**: View their children's progress and academic information
7. **STUDENT**: Course enrollment and learning activities

### Course Hierarchy
```
Course (status: DRAFT/PUBLISHED/ARCHIVED)
  └── Module (ordered sections)
      └── Lesson (ordered lessons)
          ├── Content (DOCUMENT/VIDEO/SCORM/XAPI/EMBED/QUIZ)
          └── Session (Teams/Zoom live sessions)
```

### Database Schema Patterns
- **Prisma Client**: Singleton pattern in `lib/prisma.ts`
- **Multi-tenancy**: `centerId` foreign key on most models
- **Parent-Student Relationships**: Self-referential relationship on User model (parentId/children)
- **Soft Deletes**: Use `ARCHIVED` status instead of deletion
- **Cascade Deletes**: Most relationships use `onDelete: Cascade`
- **Indexing**: All foreign keys and frequently queried fields are indexed

## Project Structure

```
app/
├── api/                          # API routes (Next.js route handlers)
│   ├── auth/[...nextauth]/       # NextAuth authentication
│   ├── users/                    # User management
│   ├── courses/                  # Course management
│   ├── academic-profile/         # Academic profiles
│   ├── gamification/             # XP, badges, achievements
│   ├── financial/                # Financial transactions & reports
│   ├── sessions/                 # Live session management
│   └── health/                   # Health check endpoint
├── dashboard/                    # Role-specific dashboards
│   ├── page.tsx                  # Main dashboard (role-based routing)
│   ├── student/                  # Student dashboard
│   ├── tutor/                    # Teacher dashboard
│   └── supervisor/               # Supervisor dashboard
├── admin/                        # Admin pages
│   ├── users/                    # User management UI
│   ├── courses/                  # Course management UI
│   └── analytics/                # Analytics dashboard
├── courses/                      # Public course pages
│   ├── page.tsx                  # Course catalog
│   └── [slug]/                   # Individual course view
├── login/                        # Login page
├── layout.tsx                    # Root layout
└── page.tsx                      # Home page

lib/
├── auth.ts                       # NextAuth configuration
├── prisma.ts                     # Prisma client singleton
└── config/                       # Configuration files
    ├── constants.ts              # Application constants
    └── gamification.ts           # Gamification rules

prisma/
├── schema.prisma                 # Database schema
└── seed.ts                       # Database seeding script

types/
└── next-auth.d.ts                # NextAuth type extensions
```

## Key Implementation Patterns

### API Authorization
All API routes should check user authentication and authorization:
```typescript
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // For center-scoped resources
  if (session.user.role !== "SUPER_ADMIN") {
    // Filter by session.user.centerId
  }
}
```

### Prisma Queries with Multi-tenancy
Always scope queries by center (except for SUPER_ADMIN):
```typescript
const courses = await prisma.course.findMany({
  where: {
    centerId: session.user.role === "SUPER_ADMIN"
      ? undefined
      : session.user.centerId,
    status: "PUBLISHED"
  },
  include: {
    teacher: { select: { id: true, name: true, email: true } },
    _count: { select: { modules: true, enrollments: true } }
  }
});
```

### Path Aliases
- `@/` maps to the root directory (configured in `tsconfig.json`)
- Example: `import { prisma } from "@/lib/prisma"`

### Environment Variables
- Development: `.env` (not committed)
- Production: `.env.production` (not committed)
- Template: `.env.production.template` (committed)
- Required variables:
  - `DATABASE_URL`: PostgreSQL connection string
  - `NEXTAUTH_URL`: Application URL (must match public URL exactly)
  - `NEXTAUTH_SECRET`: Secret for NextAuth sessions (generate with `openssl rand -base64 32`)
  - `AUTH_TRUST_HOST`: Must be `true` for production (NextAuth v5 requirement)

### Governance & Security Helpers

Three critical helper modules enforce security and compliance:

**Audit Logging** (`lib/audit.ts`):
```typescript
import { createAuditLog, auditUpdate, auditApprove } from "@/lib/audit";

// Log privileged actions
await auditUpdate(
  session.user.id,
  session.user.name,
  session.user.role as Role,
  "Invoice",
  invoice.id,
  { status: "PENDING" },
  { status: "PAID" },
  session.user.centerId,
  request.headers.get("x-forwarded-for") || undefined
);
```

**RBAC Permissions** (`lib/rbac.ts`):
```typescript
import { hasPermission, requirePermission, Permissions } from "@/lib/rbac";

// Check permissions
if (!hasPermission(session, Permissions.FINANCE_REFUND_APPROVE)) {
  return new Response("Forbidden", { status: 403 });
}

// Or throw on missing permission
requirePermission(session, Permissions.AUDIT_VIEW);
```

**Multi-Tenancy** (`lib/tenancy.ts`):
```typescript
import { getCentreIdForQuery, validateCentreAccess, preventCentreIdInjection } from "@/lib/tenancy";

// Security: Prevent centreId injection from request body
const body = await request.json();
preventCentreIdInjection(body);

// Get centreId (respects SUPER_ADMIN cross-centre access)
const centreId = getCentreIdForQuery(session, searchParams.get("centreId"));

// Validate resource access
validateCentreAccess(session, resource.centreId);
```

**Important**:
- Always log privileged operations (CREATE, UPDATE, DELETE, APPROVE)
- Use RBAC helpers instead of manual role checks
- **CRITICAL**: centreId MUST come from session only, never from request body

## Database Operations

### Schema Changes
1. Edit `prisma/schema.prisma`
2. Run `npm run db:generate` to update Prisma client
3. Run `npm run db:push` to apply to database
4. **Note**: This project uses `db push` (no migrations) for rapid development

### Seeding
- Run `npm run db:seed` to populate database with demo data
- Creates centers, users (all roles), courses, modules, lessons
- Demo credentials are in README.md

### Common Queries
```typescript
// Get user with center
const user = await prisma.user.findUnique({
  where: { email },
  include: { center: true }
});

// Get course with full hierarchy
const course = await prisma.course.findUnique({
  where: { id_centerId: { id: courseId, centerId } },
  include: {
    modules: {
      include: {
        lessons: {
          include: { contents: true }
        }
      },
      orderBy: { order: 'asc' }
    }
  }
});

// Track progress
await prisma.progress.upsert({
  where: { userId_lessonId: { userId, lessonId } },
  update: { completed: true, completedAt: new Date() },
  create: { userId, lessonId, completed: true, completedAt: new Date() }
});
```

## Production Deployment

### Architecture
```
Internet → CloudFlare (SSL/CDN) → CloudFlare Tunnel → Nginx (80/443) → Next.js (3001) → PostgreSQL (5432)
```

### Deployment Process
1. Code changes committed to git
2. Run `./scripts/build-and-deploy.sh`:
   - Creates timestamped backup
   - Installs dependencies
   - Generates Prisma client
   - Builds Next.js application
   - Restarts PM2 processes
   - Runs health checks
   - Auto-rollback on failure

### Rollback Procedure
If deployment fails or issues occur:
```bash
./scripts/rollback.sh              # Interactive selection
./scripts/rollback.sh latest       # Rollback to latest backup
./scripts/rollback.sh backup-name  # Rollback to specific backup
```

### Health Checks
```bash
./scripts/health-check.sh                                    # Local check
./scripts/health-check.sh --verbose                          # Detailed output
./scripts/health-check.sh --url https://lms.gagneet.com/api/health  # Public URL
```

### PM2 Configuration
- Config file: `ecosystem.config.cjs`
- App name: `lms-nextjs`
- Cluster mode: `max` (all CPU cores)
- Port: 3001
- Logs: `./logs/pm2-*.log`
- Auto-restart on crash with exponential backoff

## Special Features

### Gamification System
- XP points and levels
- Badges (5 types: COMPLETION, STREAK, MASTERY, PARTICIPATION, SPECIAL)
- Achievements (category-based milestones)
- Activity streaks
- Config: `lib/config/gamification.ts`

### Financial Tracking
- Transaction types: STUDENT_FEE, STUDENT_PAYMENT, TUTOR_PAYMENT, OPERATIONAL_COST, REFUND
- Financial reports with profit margins
- Multi-currency support (USD default)

### Academic Profiles
- Tracks chronological age, reading age, numeracy age
- Comprehension index, writing proficiency
- Used for personalized learning paths

### Live Sessions
- Providers: Teams, Zoom, Chime, Other
- Session status: SCHEDULED, LIVE, COMPLETED, CANCELLED
- Attendance tracking with join/leave times
- Recording and transcript URLs

## Development Notes

### TypeScript Configuration
- Strict mode enabled
- Path alias `@/` for root directory
- JSX: `react-jsx` (new JSX transform)
- Target: ES2017

### Tailwind CSS Configuration
- **Version**: Tailwind CSS v3 (stable)
- **Important**: Do NOT upgrade to Tailwind v4 - it has compatibility issues with Next.js 16
- PostCSS config uses `tailwindcss` and `autoprefixer` plugins
- If CSS is not applying after build, check:
  - PostCSS config should use `tailwindcss: {}`, not `@tailwindcss/postcss: {}`
  - Run `rm -rf .next && npm run build` for clean rebuild
  - CSS file should be ~21KB, not ~5KB
  - Verify CSS contains classes like `text-5xl`, `from-blue-50`, `font-bold`

### Testing User Flows
Use demo credentials from database seed (3-month history):
- Super Admin: admin@lms.com / admin123
- Center Admin (Centre Head): centeradmin@lms.com / admin123
- Supervisor: supervisor@lms.com / admin123
- Finance Admin: finance@lms.com / admin123
- Teacher 1 (Programming): teacher@lms.com / teacher123
- Teacher 2 (Mathematics): teacher2@lms.com / teacher123
- Parent 1 (2 children): parent1@lms.com / admin123
- Parent 2 (1 child): parent2@lms.com / admin123
- Parent 3 (1 child): parent3@lms.com / admin123
- Student 1 (High performer): student@lms.com / student123
- Student 2 (Average): student2@lms.com / student123
- Student 3 (Needs attention): student3@lms.com / student123
- Student 4 (New): student4@lms.com / student123

### Common Gotchas
- Always scope API queries by `centerId` unless user is SUPER_ADMIN
- Course slugs are unique per center, not globally (composite unique constraint)
- Use `npm run db:generate` after any schema changes
- PM2 runs on port 3001 (not 3000) in production
- Session data includes role and centerId - use these for authorization
- Prisma client must be imported from `@/lib/prisma` (singleton pattern)
- **Tailwind CSS v3 only** - v4 causes incomplete CSS generation (known issue)
- After deployment, purge CloudFlare cache if CSS doesn't load

## Testing

### Playwright E2E Tests
```bash
npx playwright test              # Run all tests
npx playwright test --ui         # Run with UI mode
npx playwright test --headed     # Run in headed browser mode
npx playwright show-report       # Show test report
```

Test files are located in `tests/` directory:
- `tests/home.spec.ts` - Home page and login portal tests
- `tests/login.spec.ts` - Authentication flow tests
- `tests/dashboard.spec.ts` - Dashboard rendering and role-based routing tests

## API Documentation

Full API documentation is available in `docs/api.md` including:
- All endpoints with request/response formats
- Authorization requirements per role
- Query parameters and filtering
- Error response formats
- Multi-tenancy behavior

## Additional Resources

All documentation is organized under the `docs/` directory:

- **API Documentation**: See `docs/api.md` for endpoint details
- **Feature List**: See `docs/features.md` for complete feature inventory
- **Deployment Guide**: See `docs/deployment.md` for deployment options
- **Production Deployment**: See `docs/deployment-production.md` for production setup
- **Deployment Quick Start**: See `docs/deployment-quickstart.md` for quick setup
- **Deployment Status**: See `docs/deployment-status.md` for current system state
- **Deployment Notes**: See `docs/deployment-notes.md` for Tailwind/CSS notes
- **CloudFlare Setup**: See `docs/cloudflare-tunnel-setup.md`
- **CloudFlare Dashboard**: See `docs/cloudflare-dashboard-setup.md`
- **Nginx Configuration**: Rate limits at `/config/nginx/lms` (login: 20/min, API: 100/min)
- **Troubleshooting**: See `docs/troubleshooting.md` for common issues
- **Implementation Summary**: See `docs/implementation-summary.md`
- **Business Analysis**: See `docs/business-technical-analysis.md`
- **Technical Implementation**: See `docs/technical-implementation.md`
- **Quick Reference**: See `docs/quickstart.md` for common operations
