# API Documentation

## Authentication

All API endpoints require authentication via NextAuth.js session cookies, except for the authentication endpoints themselves.

## Endpoints

### Authentication

#### POST /api/auth/[...nextauth]
NextAuth.js authentication handler for login/logout.

**Login Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** Session cookie

---

### Users

#### GET /api/users
Get list of users.

**Query Parameters:**
- `role` (optional): Filter by user role (SUPER_ADMIN, CENTER_ADMIN, CENTER_SUPERVISOR, TEACHER, STUDENT)

**Authorization:**
- Super Admin: Can view all users across all centers
- Center Admin/Supervisor: Can view users in their center only

**Response:**
```json
[
  {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "TEACHER",
    "avatar": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "center": {
      "id": "center_id",
      "name": "Main Campus"
    }
  }
]
```

#### POST /api/users
Create a new user.

**Authorization:**
- SUPER_ADMIN: Can create users in any center
- CENTER_ADMIN: Can create users in their center only

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "password": "securePassword123",
  "role": "STUDENT",
  "centerId": "center_id" // Optional, defaults to current user's center
}
```

**Response:**
```json
{
  "id": "new_user_id",
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "role": "STUDENT",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "center": {
    "id": "center_id",
    "name": "Main Campus"
  }
}
```

---

### Courses

#### GET /api/courses
Get list of courses.

**Query Parameters:**
- `status` (optional): Filter by course status (DRAFT, PUBLISHED, ARCHIVED)

**Authorization:**
- Students: Only see published courses
- Teachers/Admins: See all courses in their center

**Response:**
```json
[
  {
    "id": "course_id",
    "title": "Introduction to Programming",
    "slug": "introduction-to-programming",
    "description": "Learn the fundamentals of programming",
    "thumbnail": null,
    "status": "PUBLISHED",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "teacher": {
      "id": "teacher_id",
      "name": "John Teacher",
      "email": "teacher@example.com"
    },
    "_count": {
      "modules": 3,
      "enrollments": 15
    }
  }
]
```

#### POST /api/courses
Create a new course.

**Authorization:**
- SUPER_ADMIN, CENTER_ADMIN, TEACHER roles

**Request Body:**
```json
{
  "title": "Web Development Basics",
  "slug": "web-development-basics",
  "description": "Master HTML, CSS, and JavaScript",
  "thumbnail": "https://example.com/image.jpg" // Optional
}
```

**Response:**
```json
{
  "id": "course_id",
  "title": "Web Development Basics",
  "slug": "web-development-basics",
  "description": "Master HTML, CSS, and JavaScript",
  "thumbnail": "https://example.com/image.jpg",
  "status": "DRAFT",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "teacher": {
    "id": "teacher_id",
    "name": "John Teacher",
    "email": "teacher@example.com"
  }
}
```

---

### Academic Profiles

#### GET /api/academic-profile/[userId]
Get academic profile for a specific user.

**Authorization:**
- Students: Can view their own profile only
- Teachers/Supervisors/Admins: Can view profiles in their center

**Response:**
```json
{
  "id": "profile_id",
  "userId": "user_id",
  "chronologicalAge": 12.5,
  "readingAge": 13.2,
  "numeracyAge": 11.8,
  "comprehensionIndex": 85.5,
  "writingProficiency": 78.0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z",
  "user": {
    "id": "user_id",
    "name": "Student Name",
    "email": "student@example.com"
  }
}
```

#### PUT /api/academic-profile/[userId]
Update academic profile for a user.

**Authorization:**
- TEACHER, CENTER_SUPERVISOR, CENTER_ADMIN, SUPER_ADMIN roles

**Request Body:**
```json
{
  "chronologicalAge": 12.5,
  "readingAge": 13.2,
  "numeracyAge": 11.8,
  "comprehensionIndex": 85.5,
  "writingProficiency": 78.0
}
```

---

### Gamification

#### GET /api/gamification/[userId]
Get gamification profile for a user.

**Authorization:**
- Students: Can view their own profile only
- Others: Can view profiles in their center

**Response:**
```json
{
  "id": "profile_id",
  "userId": "user_id",
  "xp": 1250,
  "level": 13,
  "streak": 7,
  "lastActivityAt": "2024-01-15T00:00:00.000Z",
  "badges": [
    {
      "id": "badge_id",
      "name": "First Course Completed",
      "description": "Completed your first course",
      "type": "COMPLETION",
      "iconUrl": "🏆",
      "earnedAt": "2024-01-10T00:00:00.000Z"
    }
  ],
  "achievements": [
    {
      "id": "achievement_id",
      "title": "Reading Master",
      "description": "Achieved 100% in reading comprehension",
      "category": "reading",
      "value": 100,
      "earnedAt": "2024-01-12T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/gamification/award-xp
Award XP points to a user.

**Authorization:**
- TEACHER, CENTER_SUPERVISOR, CENTER_ADMIN, SUPER_ADMIN roles

**Request Body:**
```json
{
  "userId": "user_id",
  "xp": 50,
  "reason": "Completed quiz with 100% score"
}
```

**Response:**
```json
{
  "profile": {
    "id": "profile_id",
    "xp": 1300,
    "level": 14,
    "streak": 7
  },
  "awarded": {
    "xp": 50,
    "reason": "Completed quiz with 100% score",
    "levelUp": true
  }
}
```

#### POST /api/gamification/award-badge
Award a badge to a user.

**Authorization:**
- TEACHER, CENTER_SUPERVISOR, CENTER_ADMIN, SUPER_ADMIN roles

**Request Body:**
```json
{
  "userId": "user_id",
  "name": "Perfect Attendance",
  "description": "Attended all sessions for a month",
  "type": "PARTICIPATION",
  "iconUrl": "🎖️"
}
```

---

### Financial Transactions

#### GET /api/financial/transactions
Get list of financial transactions.

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `centerId` (optional): Filter by center ID (Super Admin only)
- `type` (optional): Filter by transaction type
- `status` (optional): Filter by status (pending, completed, failed)

**Authorization:**
- CENTER_SUPERVISOR, CENTER_ADMIN, SUPER_ADMIN roles
- Students can only view their own transactions

**Response:**
```json
[
  {
    "id": "transaction_id",
    "amount": 150.00,
    "type": "STUDENT_PAYMENT",
    "description": "Monthly tuition fee",
    "status": "completed",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "user_id",
      "name": "Student Name",
      "email": "student@example.com"
    },
    "center": {
      "id": "center_id",
      "name": "Main Campus"
    }
  }
]
```

#### POST /api/financial/transactions
Create a new financial transaction.

**Authorization:**
- CENTER_SUPERVISOR, CENTER_ADMIN, SUPER_ADMIN roles

**Request Body:**
```json
{
  "userId": "user_id",
  "amount": 150.00,
  "type": "STUDENT_FEE",
  "description": "Monthly tuition fee",
  "status": "pending",
  "metadata": {
    "invoiceNumber": "INV-2024-001"
  }
}
```

**Transaction Types:**
- `STUDENT_FEE`: Fee charged to student
- `STUDENT_PAYMENT`: Payment received from student
- `TUTOR_PAYMENT`: Payment to tutor
- `OPERATIONAL_COST`: Other operational costs
- `REFUND`: Refund to student

#### GET /api/financial/reports
Get financial summary and reports.

**Query Parameters:**
- `centerId` (optional): Filter by center ID (Super Admin only)

**Authorization:**
- CENTER_SUPERVISOR, CENTER_ADMIN, SUPER_ADMIN roles

**Response:**
```json
{
  "summary": {
    "totalRevenue": 15000.00,
    "totalTutorPayments": 8000.00,
    "totalOperationalCosts": 2000.00,
    "totalRefunds": 500.00,
    "pendingPayments": 1200.00,
    "completedPayments": 14500.00,
    "transactionCount": 125,
    "netRevenue": 14500.00,
    "totalCosts": 10000.00,
    "profitMargin": 4500.00,
    "profitMarginPercentage": 31.03
  },
  "currency": "USD"
}
```

---

### Live Sessions

#### POST /api/sessions/create
Create a new live session (Teams/Zoom).

**Authorization:**
- TEACHER, CENTER_SUPERVISOR, CENTER_ADMIN, SUPER_ADMIN roles

**Request Body:**
```json
{
  "lessonId": "lesson_id",
  "title": "Introduction to Algebra",
  "description": "Live session covering basic algebra concepts",
  "provider": "TEAMS",
  "startTime": "2024-01-20T10:00:00.000Z",
  "endTime": "2024-01-20T11:00:00.000Z",
  "tutorId": "tutor_id"
}
```

**Session Providers:**
- `TEAMS`: Microsoft Teams
- `ZOOM`: Zoom
- `CHIME`: Amazon Chime
- `OTHER`: Other video providers

**Response:**
```json
{
  "id": "session_id",
  "title": "Introduction to Algebra",
  "description": "Live session covering basic algebra concepts",
  "provider": "TEAMS",
  "startTime": "2024-01-20T10:00:00.000Z",
  "endTime": "2024-01-20T11:00:00.000Z",
  "status": "SCHEDULED",
  "lesson": {
    "id": "lesson_id",
    "title": "Algebra Basics"
  }
}
```

#### GET /api/sessions/[sessionId]
Get session details.

**Authorization:**
- Users in the same center as the session

**Response:**
```json
{
  "id": "session_id",
  "title": "Introduction to Algebra",
  "provider": "TEAMS",
  "providerMeetingId": "meeting_123",
  "joinUrl": "https://teams.microsoft.com/...",
  "startTime": "2024-01-20T10:00:00.000Z",
  "endTime": "2024-01-20T11:00:00.000Z",
  "status": "LIVE",
  "recordingUrl": null,
  "transcriptUrl": null,
  "attendance": [
    {
      "id": "attendance_id",
      "userId": "user_id",
      "joinedAt": "2024-01-20T10:02:00.000Z",
      "leftAt": null,
      "attended": true,
      "user": {
        "id": "user_id",
        "name": "Student Name",
        "email": "student@example.com"
      }
    }
  ]
}
```

#### PUT /api/sessions/[sessionId]
Update session details.

**Authorization:**
- TEACHER, CENTER_SUPERVISOR, CENTER_ADMIN, SUPER_ADMIN roles

**Request Body:**
```json
{
  "title": "Updated Session Title",
  "status": "COMPLETED",
  "recordingUrl": "https://recordings.example.com/session123",
  "transcriptUrl": "https://transcripts.example.com/session123"
}
```

**Session Status:**
- `SCHEDULED`: Session is scheduled
- `LIVE`: Session is currently active
- `COMPLETED`: Session has ended
- `CANCELLED`: Session was cancelled

---

## Data Models

### User Roles
```
- **SUPER_ADMIN**: Full system access across all centers
- **CENTER_ADMIN**: Administrative control within a specific center
- **CENTER_SUPERVISOR**: Supervisory access within a specific center
- **TEACHER**: Course creation and student management
- **STUDENT**: Course enrollment and learning activities

### Course Status

- **DRAFT**: Course is being created, not visible to students
- **PUBLISHED**: Course is live and available for enrollment
- **ARCHIVED**: Course is no longer active but still accessible

### Content Types

- **DOCUMENT**: PDF, Word documents, etc.
- **VIDEO**: MP4, WebM video files
- **SCORM**: SCORM packages for e-learning
- **XAPI**: xAPI/TinCan learning content
- **EMBED**: Embedded content (YouTube, Vimeo, etc.)
- **QUIZ**: Quizzes and assessments

---

## Error Responses

All API endpoints return appropriate HTTP status codes:

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

Error response format:
```json
{
  "error": "Error message description"
}
```

---

## Multi-Tenancy

The system supports multiple centers (tenants) under one instance:

- Each user belongs to one center
- Data is isolated per center (except for Super Admins)
- Course slugs are unique within a center, not globally
- Users can only access resources within their center (except Super Admins)

---

## Security

- All passwords are hashed using bcrypt with 10 salt rounds
- Authentication via NextAuth.js with secure session cookies
- Role-based authorization on all API endpoints
- SQL injection prevention via Prisma ORM
- CSRF protection via NextAuth.js

---

## Phase 1 v1 API Endpoints

### Assessments

#### POST /api/v1/assessments
Record or update a subject-level assessment for a student.

**Authorization:** TEACHER, CENTER_ADMIN, CENTER_SUPERVISOR, SUPER_ADMIN

**Request Body:**
```json
{
  "studentId": "student_id",
  "courseId": "course_id",
  "assessedGradeLevel": 4,
  "readingAge": 8.5,
  "numeracyAge": 9.0,
  "comprehensionLevel": 75.0,
  "writingLevel": 70.0,
  "notes": "Student progressing well at Grade 4 level"
}
```

**Response (201):**
```json
{
  "assessment": {
    "id": "assessment_id",
    "studentId": "student_id",
    "courseId": "course_id",
    "assessedGradeLevel": 4,
    "readingAge": 8.5,
    "lastAssessedAt": "2026-02-20T00:00:00.000Z"
  }
}
```

**Notes:**
- Upserts based on `[studentId, courseId]` unique pair
- Automatically creates an `AcademicProfileLog` entry on level changes
- Multi-tenant: validates student belongs to caller's center

---

### Student Traits

#### POST /api/v1/student-traits
Create a strength or weakness record for a student.

**Authorization:** TEACHER, CENTER_ADMIN, CENTER_SUPERVISOR, SUPER_ADMIN

**Request Body:**
```json
{
  "studentId": "student_id",
  "courseId": "course_id",
  "type": "STRENGTH",
  "description": "Excellent reading comprehension"
}
```

**Response (201):**
```json
{
  "trait": {
    "id": "trait_id",
    "studentId": "student_id",
    "type": "STRENGTH",
    "description": "Excellent reading comprehension",
    "createdAt": "2026-02-20T00:00:00.000Z"
  }
}
```

**Values for `type`:** `STRENGTH`, `WEAKNESS`

#### GET /api/v1/student-traits
List all student traits visible to the caller.

**Authorization:** All authenticated roles

**Query Parameters:**
- `studentId` (optional): Filter by student
- `type` (optional): Filter by `STRENGTH` or `WEAKNESS`

**Response (200):**
```json
{
  "traits": [...]
}
```

---

### Tickets

#### GET /api/v1/tickets
List support tickets. Students/Parents see only their own tickets. Staff see all tickets in their center.

**Authorization:** All authenticated roles

**Query Parameters:**
- `status` (optional): Filter by ticket status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `ESCALATED`)

**Response (200):** Array of ticket objects

#### POST /api/v1/tickets
Create a new support ticket.

**Authorization:** All authenticated roles

**Request Body:**
```json
{
  "type": "IT",
  "priority": "MEDIUM",
  "subject": "Laptop not connecting to projector",
  "description": "The laptop in Room 3 cannot connect to the projector. Tried restarting but same issue."
}
```

**Values for `type`:** `IT`, `INVENTORY`, `COMPLAINT`, `MAINTENANCE`, `GENERAL`
**Values for `priority`:** `LOW`, `MEDIUM`, `HIGH`, `URGENT`

**Response (201):**
```json
{
  "ticket": {
    "id": "ticket_id",
    "ticketNumber": "TICK-2026-0001",
    "type": "IT",
    "priority": "MEDIUM",
    "status": "OPEN",
    "subject": "Laptop not connecting to projector",
    "slaDueAt": "2026-02-21T00:00:00.000Z"
  }
}
```

**Notes:**
- `ticketNumber` is auto-generated as `TICK-{YEAR}-{SEQUENCE}`
- `slaDueAt` is auto-calculated from `SLAConfig` for the center, or defaults to 24h for IT/GENERAL, 4h for HIGH, 1h for URGENT
