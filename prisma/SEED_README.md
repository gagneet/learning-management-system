# Database Seed Data Documentation

This document describes the comprehensive seed data created for testing and development purposes.

## Running the Seed

```bash
npm run db:seed
```

**Note:** The seed script uses `upsert` operations, so it's safe to run multiple times. Existing records will be updated, not duplicated.

## User Accounts

All passwords are hashed using bcrypt with 10 salt rounds.

### Administrators

| Email | Password | Role | Name | Description |
|-------|----------|------|------|-------------|
| admin@lms.com | admin123 | SUPER_ADMIN | Super Admin | Full system access across all centers |
| centeradmin@lms.com | admin123 | CENTER_ADMIN | Sarah Johnson | Centre Head with 15 years of educational leadership experience |
| supervisor@lms.com | admin123 | CENTER_SUPERVISOR | David Martinez | Academic Supervisor overseeing curriculum and teaching quality |
| finance@lms.com | admin123 | CENTER_SUPERVISOR | Emily Chen | Financial Administrator managing billing and payments |

### Teachers

| Email | Password | Role | Name | Specialty |
|-------|----------|------|------|-----------|
| teacher@lms.com | teacher123 | TEACHER | John Teacher | Computer Science educator specializing in programming fundamentals |
| teacher2@lms.com | teacher123 | TEACHER | Maria Garcia | Mathematics teacher with expertise in algebra and calculus |

### Students

| Email | Password | Role | Name | Performance Level | Enrollments | Progress Range |
|-------|----------|------|------|------------------|-------------|----------------|
| student@lms.com | student123 | STUDENT | Jane Student | High Performer | 3 courses | 30-85% |
| student2@lms.com | student123 | STUDENT | Alex Thompson | Average | 2 courses | 38-55% |
| student3@lms.com | student123 | STUDENT | Michael Lee | Needs Attention | 2 courses | 8-15% |
| student4@lms.com | student123 | STUDENT | Sophia Patel | Just Started | 1 course | 0% |

## Centres

- **Main Campus** (slug: `main-campus`)
  - Primary learning center
  - Region: North America
  - Timezone: America/New_York
  
- **Online Campus** (slug: `online-campus`)
  - Virtual learning center
  - Region: Global
  - Timezone: UTC

## Courses

All courses are PUBLISHED status and belong to Main Campus.

### 1. Introduction to Programming
- **Slug:** `introduction-to-programming`
- **Teacher:** John Teacher
- **Modules:** 3
  - Getting Started (3 lessons)
  - Variables and Data Types (2 lessons)
  - Control Flow
- **Enrollments:** 3 students

### 2. Web Development Basics
- **Slug:** `web-development-basics`
- **Teacher:** John Teacher
- **Modules:** 3
  - HTML Basics (3 lessons)
  - CSS Styling
  - JavaScript Fundamentals
- **Enrollments:** 3 students

### 3. Algebra Fundamentals
- **Slug:** `algebra-fundamentals`
- **Teacher:** Maria Garcia
- **Modules:** 2
  - Introduction to Algebra (2 lessons)
  - Solving Equations
- **Enrollments:** 2 students

### 4. Advanced Mathematics
- **Slug:** `advanced-mathematics`
- **Teacher:** Maria Garcia
- **Modules:** 0 (for testing empty course)
- **Enrollments:** 0

## Gamification Data

### XP and Levels

| Student | XP | Level | Streak | Last Activity |
|---------|-----|-------|--------|---------------|
| Jane Student | 2450 | 8 | 12 days | Today |
| Alex Thompson | 1200 | 5 | 5 days | Today |
| Michael Lee | 450 | 2 | 1 day | 2 days ago |
| Sophia Patel | 150 | 1 | 3 days | Today |

### Badges

- **Jane Student:** 3 badges
  - First Lesson (COMPLETION)
  - 7-Day Streak (STREAK)
  - Quick Learner (MASTERY)
- **Alex Thompson:** 1 badge
  - First Lesson (COMPLETION)
- **Sophia Patel:** 1 badge
  - First Lesson (COMPLETION)

### Achievements

- **Jane Student:** 2 achievements
  - Course Completion (100%)
  - Perfect Attendance (100%)
- **Alex Thompson:** 1 achievement
  - Half Way There (50%)

## Academic Profiles

| Student | Chronological Age | Reading Age | Numeracy Age | Comprehension | Writing |
|---------|-------------------|-------------|--------------|---------------|---------|
| Jane Student | 14.5 | 16.2 | 15.8 | 88.5% | 82.0% |
| Alex Thompson | 13.8 | 13.5 | 14.0 | 75.0% | 71.5% |
| Michael Lee | 15.2 | 13.8 | 13.2 | 62.0% | 58.5% |
| Sophia Patel | 14.0 | 14.5 | 14.8 | 80.0% | 76.0% |

## Live Sessions

### Today's Sessions (3)
1. **Introduction to Programming - Live Q&A**
   - Time: 10:00 - 11:00
   - Provider: Teams
   - Status: SCHEDULED
   - Pre-registered: 3 students

2. **HTML Basics Workshop**
   - Time: 14:00 - 15:30
   - Provider: Zoom
   - Status: SCHEDULED
   - Pre-registered: 3 students

3. **Algebra Study Group**
   - Time: 16:00 - 17:00
   - Provider: Teams
   - Status: SCHEDULED
   - Pre-registered: 2 students

### Tomorrow's Sessions (2)
1. **Variables Deep Dive**
   - Time: 10:00 - 11:30
   - Provider: Teams
   - Pre-registered: 2 students

2. **CSS Styling Techniques**
   - Time: 15:00 - 16:30
   - Provider: Zoom
   - Pre-registered: 2 students

### Completed Sessions (3)
All completed sessions include recording URLs and attendance data.

## Session Attendance

Attendance data for completed sessions:

| Session | Total Registered | Attended | Attendance Rate |
|---------|------------------|----------|----------------|
| Getting Started with Programming | 3 | 2 | 67% |
| HTML Fundamentals | 3 | 2 | 67% |
| Algebraic Expressions Workshop | 2 | 1 | 50% |

## Financial Transactions

Total: 17 transactions

### Student Fees (6 transactions)
- 4 completed: $1,900.00
- 2 pending: $950.00
- Total fees: $2,850.00

### Student Payments (4 transactions)
- All completed: $1,900.00
- Outstanding: $950.00

### Tutor Payments (4 transactions)
- John Teacher: $2,400.00 (2 months)
- Maria Garcia: $2,200.00 (2 months)
- Total: $4,600.00

### Operational Costs (3 transactions)
- Office supplies: $250.00
- Software licenses: $150.00
- Facility maintenance: $300.00
- Total: $700.00

## Progress Records

The seed creates realistic progress records for students:

- **Jane Student (High Performer):** 7 progress records, 6 completed lessons
- **Alex Thompson (Average):** 4 progress records, 3 completed lessons
- **Michael Lee (Needs Attention):** 2 progress records, 1 completed lesson
- **Sophia Patel (Just Started):** 0 progress records (just enrolled)

## Testing Scenarios

The seed data supports testing of:

1. **Multi-tenancy:** 2 centers with isolated data
2. **Role-based access:** All 5 roles represented
3. **Course hierarchy:** Courses → Modules → Lessons → Content
4. **Progress tracking:** Varying completion rates
5. **Gamification:** XP, levels, badges, achievements, streaks
6. **Academic profiling:** Age-based assessments
7. **Live sessions:** Scheduled, ongoing, and completed
8. **Attendance tracking:** Historical attendance data
9. **Financial management:** Revenue, expenses, pending payments
10. **Performance analytics:** Student performance ranges for marking queue
11. **Empty states:** Some courses/students with no data

## Notes

- **Parent Role:** Not included in the current schema. If added in future, update seed accordingly.
- **Finance Role:** Using CENTER_SUPERVISOR role for financial staff (no dedicated role in schema).
- **Time-based Data:** Sessions use relative dates (today, tomorrow, last week) so data remains relevant.
- **Realistic Variations:** Students have different performance levels to test filtering and sorting.
- **Incomplete Courses:** Course 4 has no modules to test empty state handling.
