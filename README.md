# Learning Management System (LMS)

A comprehensive web-based platform for managing courses, users, and learning content. Built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## 🌟 Key Features

### Multi-Tenancy Support
- Support for multiple centers or "tenants" under one instance
- Isolated data and management per center
- Cross-center administration for super admins

### Role-Based Access Control (RBAC)
- **Super Admin**: Full system access across all centers
- **Center Admin/Supervisor**: Administrative control within a specific center
- **Teacher/Tutor**: Course creation and student management
- **Student**: Course enrollment and learning activities

### Course Management
- Hierarchical course structure (Course → Module → Lesson → Content)
- Support for multiple content types:
  - Documents (PDF, Word, etc.)
  - Videos (MP4, WebM, etc.)
  - SCORM packages
  - xAPI/TinCan content
  - Embedded content (YouTube, etc.)
  - Quizzes and assessments

### User Management
- Streamlined user onboarding
- Role assignment and permissions
- User profiles and avatars
- Progress tracking

### Analytics & Reporting
- Course completion tracking
- Student progress monitoring
- Engagement analytics
- Center-wide reporting

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

After seeding the database, you can log in with these credentials:

- **Super Admin**: admin@lms.com / admin123
- **Center Admin**: centeradmin@lms.com / admin123
- **Teacher**: teacher@lms.com / teacher123
- **Student**: student@lms.com / student123

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
- **User**: System users with role-based permissions
- **Course**: Learning courses with hierarchical structure
- **Module**: Course modules (sections)
- **Lesson**: Individual lessons within modules
- **Content**: Learning materials (videos, documents, SCORM, etc.)
- **Enrollment**: Student course enrollments
- **Progress**: Lesson completion tracking

## 🔒 Security

- Passwords hashed with bcrypt
- Authentication via NextAuth.js
- Role-based authorization on all API endpoints
- Data isolation per center for multi-tenancy

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

Built for comprehensive school learning management from Primary School to Senior School and beyond!
