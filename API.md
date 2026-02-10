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

## Data Models

### User Roles

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
