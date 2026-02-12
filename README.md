# Learning Management System (LMS)

A comprehensive web-based platform for managing courses, users, and learning content. Built with Next.js 16, React 19, TypeScript, Prisma, and PostgreSQL.

## 🌟 Key Features

### Multi-Tenancy Support
- Support for multiple centers or "tenants" under one instance
- Isolated data and management per center
- Cross-center administration for super admins
- Centre-scoped data isolation with security helpers

### Role-Based Access Control (RBAC)
- **7-tier role hierarchy** with granular permissions
- **Super Admin**: Full system access across all centers
- **Center Admin**: Administrative control within their center
- **Center Supervisor**: Supervisory access and oversight
- **Finance Admin**: Financial management and billing
- **Teacher/Tutor**: Course creation and student management
- **Parent**: View children's progress and information
- **Student**: Course enrollment and learning activities
- Permission-based authorization (72+ permissions across domains)

### 📚 Academic Domain
- **Course Management**: Hierarchical structure (Course → Module → Lesson → Content)
- **Class Cohorts**: Group-based learning with capacity management
- **Live Sessions**: Teams/Zoom integration with attendance tracking
- **Attendance Management**: Real-time tracking (PRESENT, LATE, ABSENT, EXCUSED)
- **Catch-Up Packages**: Automated generation for missed sessions
- **Academic Profiles**: Reading age, numeracy age, comprehension tracking
- **Progress Tracking**: Detailed student progress and completion metrics
- **Content Types**: Documents, Videos, SCORM, xAPI, Embedded content, Quizzes

### 🎫 Operations Domain
- **Ticketing System**: IT, Inventory, Complaints, Maintenance, General
- **SLA Management**: Configurable response and resolution times
- **Priority Levels**: LOW, MEDIUM, HIGH, URGENT
- **Ticket Workflow**: OPEN → IN_PROGRESS → RESOLVED → CLOSED
- **Escalation**: Automatic escalation on SLA breach
- **Comments & Attachments**: Internal notes and public updates

### 💰 Finance Domain
- **Fee Plans**: WEEKLY, MONTHLY, TERM, ANNUAL billing
- **Student Accounts**: Balance tracking and account management
- **Invoicing**: Multi-line invoices with automatic calculations
- **Payment Processing**: CASH, CHECK, CARD, BANK_TRANSFER
- **Refund Management**: Request and approval workflow
- **Financial Reports**: Revenue, expenses, profit tracking
- **Payment Status**: PAID, PARTIAL, OVERDUE, CANCELLED

### 🔒 Governance Domain
- **Audit Logging**: Immutable audit trail for all privileged actions
- **Approval Workflows**: REFUND, FEE_WAIVER, TUTOR_OVERRIDE, PAYROLL_EXCEPTION
- **Security Helpers**: Audit, RBAC, Multi-tenancy enforcement
- **Compliance**: Complete action history for regulatory requirements
- **Access Control**: Fine-grained permission system

### 🎮 Gamification
- **XP & Levels**: Point-based progression system
- **Badges**: COMPLETION, STREAK, MASTERY, PARTICIPATION, SPECIAL
- **Achievements**: Category-based milestones
- **Activity Streaks**: Consecutive day tracking

### User Management
- Streamlined user onboarding
- Role assignment and permissions
- User profiles with academic metrics
- Parent-student relationship management
- Progress tracking across all activities

### Analytics & Reporting
- Course completion tracking
- Student progress monitoring
- Engagement analytics
- Financial reporting
- Center-wide reporting
- Audit trail analytics

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/gagneet/learning-management-system.git
cd learning-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure your database connection:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/lms_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
```

4. Generate Prisma client and push schema to database:
```bash
npm run db:generate
npm run db:push
```

5. Seed the database with sample data:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Credentials

After seeding the database, you'll have **comprehensive Phase 1 test data** including:
- 3 months of historical data across all domains
- 3 active class cohorts with 8 student memberships
- 8 tickets across all types and statuses
- 8 invoices with various payment statuses
- 2 pending approval requests
- 12 audit events for compliance testing

You can log in with these credentials:

**Administrators:**
- **Super Admin**: admin@lms.com / admin123
- **Center Admin (Centre Head)**: centeradmin@lms.com / admin123
- **Supervisor**: supervisor@lms.com / admin123
- **Finance Admin**: finance@lms.com / admin123

**Teachers:**
- **Teacher 1 (Programming)**: teacher@lms.com / teacher123
- **Teacher 2 (Mathematics)**: teacher2@lms.com / teacher123

**Parents:**
- **Parent 1 (2 children)**: parent1@lms.com / admin123
- **Parent 2 (1 child)**: parent2@lms.com / admin123
- **Parent 3 (1 child)**: parent3@lms.com / admin123

**Students:**
- **Student 1 - Jane (High performer)**: student@lms.com / student123
- **Student 2 - Alex (Average)**: student2@lms.com / student123
- **Student 3 - Michael (Needs attention)**: student3@lms.com / student123
- **Student 4 - Sophia (New student)**: student4@lms.com / student123

## 📁 Project Structure

```
learning-management-system/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── users/           # User management APIs
│   │   └── courses/         # Course management APIs
│   ├── dashboard/           # User dashboard
│   ├── login/               # Login page
│   ├── admin/               # Admin pages
│   ├── courses/             # Course pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── lib/                     # Utility libraries
│   ├── prisma.ts           # Prisma client
│   └── auth.ts             # NextAuth configuration
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma       # Prisma schema
│   └── seed.ts             # Database seeding script
├── types/                   # TypeScript type definitions
└── public/                  # Static files
```

## 🗄️ Database Schema

### Core Models

- **Center**: Multi-tenant organization units
- **User**: System users with 7-tier role-based permissions
- **Course**: Learning courses with hierarchical structure
- **Module**: Course modules (sections)
- **Lesson**: Individual lessons within modules
- **Content**: Learning materials (videos, documents, SCORM, etc.)
- **Enrollment**: Student course enrollments
- **Progress**: Lesson completion tracking

### Phase 1 Models

**Academic Domain (8 models)**
- **ClassCohort**: Group-based classes with capacity management
- **ClassMembership**: Student enrollment in classes
- **Session**: Live sessions (Teams/Zoom) with recordings
- **SessionAttendance**: Legacy attendance tracking
- **AttendanceRecord**: Enhanced attendance with status
- **CatchUpPackage**: Automated catch-up for missed sessions
- **AcademicProfile**: Student academic metrics
- **GamificationProfile**: XP, levels, badges, achievements

**Operations Domain (4 models)**
- **Ticket**: Support tickets with SLA tracking
- **TicketComment**: Ticket discussions (internal/public)
- **TicketAttachment**: File attachments
- **SLAConfig**: Service level agreements by type/priority

**Finance Domain (7 models)**
- **FeePlan**: Billing plans (WEEKLY, MONTHLY, TERM, ANNUAL)
- **StudentAccount**: Student financial accounts
- **Invoice**: Multi-line invoices with calculations
- **InvoiceLine**: Invoice line items
- **Payment**: Payment records (CASH, CHECK, CARD, etc.)
- **Refund**: Refund requests and approvals

**Governance Domain (2 models)**
- **AuditEvent**: Immutable audit logs for compliance
- **ApprovalRequest**: Approval workflows (REFUND, FEE_WAIVER, etc.)

**Total: 30+ models with 25+ indexes for optimal performance**

## 🔒 Security

- **Password Security**: Hashed with bcrypt (10 salt rounds)
- **Authentication**: NextAuth.js v5 with credentials provider
- **Authorization**: 72+ granular permissions across 7 roles
- **Multi-Tenancy**: Enforced data isolation per center
- **Audit Logging**: Immutable audit trail for all privileged operations
- **Security Helpers**: Three critical modules enforce governance
  - `lib/audit.ts` - Audit logging for compliance
  - `lib/rbac.ts` - Permission-based authorization
  - `lib/tenancy.ts` - Multi-tenancy enforcement
- **CRITICAL**: centreId comes from session only, never from request body

## 🛠️ Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database with sample data

## 🚀 Production Deployment

The LMS application is deployed to production at **https://lms.gagneet.com**.

### Quick Deployment

For regular updates to production:

```bash
./scripts/build-and-deploy.sh
```

This automated script handles:
- Prerequisites validation
- Automated backups
- Dependency installation
- Database migrations
- Application build
- PM2 restart
- Health verification
- Automatic rollback on failure

### Deployment Scripts

- **`./scripts/database-setup.sh`** - Initial database setup
- **`./scripts/generate-env-production.sh`** - Generate production environment file
- **`./scripts/build-and-deploy.sh`** - Automated deployment
- **`./scripts/rollback.sh`** - Rollback to previous backup
- **`./scripts/health-check.sh`** - Health monitoring
- **`./scripts/configure-cloudflare-tunnel.sh`** - CloudFlare tunnel configuration

### Rollback

If a deployment fails or issues are discovered:

```bash
# List available backups
./scripts/rollback.sh

# Rollback to latest backup
./scripts/rollback.sh latest

# Rollback to specific backup
./scripts/rollback.sh backup-20260210-120000
```

### Health Check

Monitor application health:

```bash
# Quick health check
./scripts/health-check.sh

# Detailed health check with verbose output
./scripts/health-check.sh --verbose

# Check from public URL
./scripts/health-check.sh --url https://lms.gagneet.com/api/health
```

### Complete Documentation

For comprehensive production deployment documentation, including:
- Architecture overview
- Initial setup instructions
- Configuration details
- Monitoring and maintenance
- Troubleshooting guide
- Security considerations

See: **[Production Deployment Guide](docs/deployment-production.md)**

## Documentation

All project documentation is organized under the `docs/` directory:

| Document | Description |
|----------|-------------|
| [API Documentation](docs/api.md) | REST API endpoints, request/response formats |
| [Features](docs/features.md) | Complete feature inventory |
| [Deployment Guide](docs/deployment.md) | Local, Vercel, and Docker deployment |
| [Production Deployment](docs/deployment-production.md) | Full production setup guide |
| [Deployment Quick Start](docs/deployment-quickstart.md) | Quick setup reference |
| [Deployment Status](docs/deployment-status.md) | Current production status |
| [Deployment Notes](docs/deployment-notes.md) | Tailwind CSS/build notes |
| [CloudFlare Tunnel Setup](docs/cloudflare-tunnel-setup.md) | Tunnel configuration |
| [CloudFlare Dashboard](docs/cloudflare-dashboard-setup.md) | Dashboard hostname setup |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and solutions |
| [Implementation Summary](docs/implementation-summary.md) | Deployment implementation details |
| [Business Analysis](docs/business-technical-analysis.md) | Business vision and architecture |
| [Technical Implementation](docs/technical-implementation.md) | Technical specs and wireframes |
| [Quick Reference](docs/quickstart.md) | Common operations cheat sheet |

### Production Architecture

```
Internet → CloudFlare (SSL/CDN) → CloudFlare Tunnel → Nginx → LMS App (PM2) → PostgreSQL
```

- **Application**: Next.js on port 3001 (PM2 cluster mode)
- **Web Server**: Nginx on ports 80/443
- **Database**: PostgreSQL on port 5432
- **SSL/CDN**: CloudFlare with Origin Certificate
- **Process Manager**: PM2 with auto-restart and clustering

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

Built for comprehensive school learning management from Primary School to Senior School and beyond!
