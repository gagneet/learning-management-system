# Session Management API Documentation

This document describes the API endpoints for managing multi-student sessions, where each student can work on different content within the same session.

## Overview

The session management system now supports:
- Sessions with multiple students
- Individual course/lesson assignments per student
- Custom exercise content and assessments per student
- Tutor notes for each student in a session
- ONLINE (virtual) and PHYSICAL (in-person) session modes

## Endpoints

### 1. Create Session with Multiple Students

**Endpoint:** `POST /api/sessions/manage`

**Description:** Creates a new session with multiple student enrollments in a single transaction.

**Required Permissions:** `SESSION_CREATE`

**Request Body:**
```json
{
  "title": "Math Tutoring Session",
  "description": "Group session covering algebra and geometry",
  "provider": "TEAMS",
  "sessionMode": "ONLINE",
  "meetingLink": "https://teams.microsoft.com/l/meetup/...",
  "startTime": "2024-03-20T10:00:00Z",
  "endTime": "2024-03-20T11:00:00Z",
  "tutorId": "tutor_id",
  "classId": "class_id_optional",
  "studentEnrollments": [
    {
      "studentId": "student1_id",
      "courseId": "algebra_course_id",
      "lessonId": "lesson1_id",
      "exerciseContent": {
        "type": "practice",
        "problems": [1, 2, 3]
      }
    },
    {
      "studentId": "student2_id",
      "courseId": "geometry_course_id",
      "lessonId": "lesson2_id"
    }
  ]
}
```

**Required Fields:**
- `title`: Session title
- `provider`: One of `TEAMS`, `ZOOM`, `CHIME`, `OTHER`
- `sessionMode`: One of `ONLINE`, `PHYSICAL`
- `meetingLink`: Required if `sessionMode` is `ONLINE`
- `physicalLocation`: Required if `sessionMode` is `PHYSICAL`
- `startTime`: ISO 8601 timestamp
- `tutorId`: ID of the tutor conducting the session

**Optional Fields:**
- `description`: Session description
- `endTime`: ISO 8601 timestamp
- `classId`: Link to a class cohort
- `studentEnrollments`: Array of student enrollment objects

**Response:** `201 Created`
```json
{
  "id": "session_id",
  "title": "Math Tutoring Session",
  "status": "SCHEDULED",
  "studentEnrollments": [
    {
      "id": "enrollment1_id",
      "studentId": "student1_id",
      "student": {
        "id": "student1_id",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": null
      },
      "courseId": "algebra_course_id",
      "course": {
        "id": "algebra_course_id",
        "title": "Algebra Fundamentals",
        "slug": "algebra-fundamentals"
      },
      "lessonId": "lesson1_id",
      "lesson": {
        "id": "lesson1_id",
        "title": "Linear Equations",
        "order": 1
      }
    }
  ]
}
```

---

### 2. Get Students in Session

**Endpoint:** `GET /api/sessions/{sessionId}/students`

**Description:** Retrieves all student enrollments for a specific session.

**Required Permissions:** `SESSION_VIEW`

**URL Parameters:**
- `sessionId`: The ID of the session

**Access Control:**
- Teachers can only view students in their own sessions
- Admins/Supervisors can view all sessions in their center
- SUPER_ADMIN can view across all centers

**Response:** `200 OK`
```json
[
  {
    "id": "enrollment1_id",
    "sessionId": "session_id",
    "studentId": "student1_id",
    "student": {
      "id": "student1_id",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null,
      "centerId": "center_id"
    },
    "courseId": "course_id",
    "course": {
      "id": "course_id",
      "title": "Algebra Fundamentals",
      "slug": "algebra-fundamentals"
    },
    "lessonId": "lesson_id",
    "lesson": {
      "id": "lesson_id",
      "title": "Linear Equations",
      "order": 1
    },
    "exerciseContent": {
      "type": "practice",
      "problems": [1, 2, 3]
    },
    "assessmentData": null,
    "notes": null,
    "completed": false,
    "createdAt": "2024-03-20T09:00:00Z",
    "updatedAt": "2024-03-20T09:00:00Z"
  }
]
```

---

### 3. Add Student to Session

**Endpoint:** `POST /api/sessions/{sessionId}/students`

**Description:** Adds a new student to an existing session.

**Required Permissions:** `SESSION_MANAGE_STUDENTS`

**URL Parameters:**
- `sessionId`: The ID of the session

**Request Body:**
```json
{
  "studentId": "student_id",
  "courseId": "course_id",
  "lessonId": "lesson_id",
  "exerciseContent": {
    "type": "assessment",
    "questions": [1, 2, 3, 4, 5]
  }
}
```

**Required Fields:**
- `studentId`: ID of the student to add

**Optional Fields:**
- `courseId`: Course the student will work on
- `lessonId`: Specific lesson for the student
- `exerciseContent`: Custom exercise content (JSON)

**Validations:**
- Student must not already be enrolled in the session
- Student must have role `STUDENT`
- Student must belong to the same center (unless SUPER_ADMIN)
- Teachers can only manage their own sessions

**Response:** `201 Created`
```json
{
  "id": "enrollment_id",
  "sessionId": "session_id",
  "studentId": "student_id",
  "student": {
    "id": "student_id",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "avatar": null
  },
  "courseId": "course_id",
  "course": {
    "id": "course_id",
    "title": "Algebra Fundamentals",
    "slug": "algebra-fundamentals"
  },
  "lessonId": "lesson_id",
  "lesson": {
    "id": "lesson_id",
    "title": "Linear Equations",
    "order": 1
  },
  "exerciseContent": {
    "type": "assessment",
    "questions": [1, 2, 3, 4, 5]
  },
  "assessmentData": null,
  "notes": null,
  "completed": false,
  "createdAt": "2024-03-20T10:00:00Z",
  "updatedAt": "2024-03-20T10:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Session or student not found
- `409 Conflict`: Student already enrolled in session
- `400 Bad Request`: User is not a student
- `403 Forbidden`: Insufficient permissions or center mismatch

---

### 4. Update Student Enrollment

**Endpoint:** `PATCH /api/sessions/{sessionId}/students/{studentId}`

**Description:** Updates a student's enrollment details in a session.

**Required Permissions:** `SESSION_MANAGE_STUDENTS`

**URL Parameters:**
- `sessionId`: The ID of the session
- `studentId`: The ID of the student

**Request Body:**
```json
{
  "courseId": "new_course_id",
  "lessonId": "new_lesson_id",
  "exerciseContent": {
    "type": "homework",
    "assignments": [1, 2, 3]
  },
  "assessmentData": {
    "score": 85,
    "answers": [...]
  },
  "notes": "Student struggled with quadratic equations. Needs more practice.",
  "completed": true
}
```

**All Fields Optional:**
- `courseId`: Update the course (can be null)
- `lessonId`: Update the lesson (can be null)
- `exerciseContent`: Update exercise content (JSON)
- `assessmentData`: Update assessment data (JSON)
- `notes`: Tutor notes for this student
- `completed`: Mark as completed/incomplete

**Access Control:**
- Teachers can only update enrollments in their own sessions
- Admins/Supervisors can update any enrollment in their center

**Response:** `200 OK`
```json
{
  "id": "enrollment_id",
  "sessionId": "session_id",
  "studentId": "student_id",
  "student": {
    "id": "student_id",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  },
  "courseId": "new_course_id",
  "course": {
    "id": "new_course_id",
    "title": "Advanced Algebra",
    "slug": "advanced-algebra"
  },
  "lessonId": "new_lesson_id",
  "lesson": {
    "id": "new_lesson_id",
    "title": "Quadratic Equations",
    "order": 5
  },
  "exerciseContent": {
    "type": "homework",
    "assignments": [1, 2, 3]
  },
  "assessmentData": {
    "score": 85,
    "answers": [...]
  },
  "notes": "Student struggled with quadratic equations. Needs more practice.",
  "completed": true,
  "createdAt": "2024-03-20T09:00:00Z",
  "updatedAt": "2024-03-20T11:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Session, student enrollment, course, or lesson not found
- `403 Forbidden`: Insufficient permissions or center mismatch

---

### 5. Remove Student from Session

**Endpoint:** `DELETE /api/sessions/{sessionId}/students/{studentId}`

**Description:** Removes a student from a session.

**Required Permissions:** `SESSION_MANAGE_STUDENTS`

**URL Parameters:**
- `sessionId`: The ID of the session
- `studentId`: The ID of the student

**Access Control:**
- Teachers can only remove students from their own sessions
- Admins/Supervisors can remove students from any session in their center

**Response:** `200 OK`
```json
{
  "message": "Student removed from session successfully"
}
```

**Error Responses:**
- `404 Not Found`: Session or student enrollment not found
- `403 Forbidden`: Insufficient permissions or center mismatch

---

## Security Features

All endpoints implement:

1. **Authentication**: Requires valid session via NextAuth
2. **RBAC**: Permission-based access control using `hasPermission()`
3. **Multi-tenancy**: Center-based data isolation
4. **Input Validation**: 
   - Required field validation
   - Enum validation (provider, sessionMode)
   - Mode-specific field validation
5. **centreId Injection Prevention**: Uses `preventCentreIdInjection(body)`
6. **Audit Logging**: All CREATE, UPDATE, DELETE operations logged
7. **Ownership Checks**: Teachers restricted to their own sessions

## Role Permissions

| Role | Create Session | View Session | Add Students | Update Enrollment | Remove Students |
|------|---------------|--------------|--------------|-------------------|-----------------|
| SUPER_ADMIN | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| CENTER_ADMIN | ✅ Center | ✅ Center | ✅ Center | ✅ Center | ✅ Center |
| CENTER_SUPERVISOR | ✅ Center | ✅ Center | ✅ Center | ✅ Center | ✅ Center |
| TEACHER | ✅ Own | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| FINANCE_ADMIN | ❌ | ❌ | ❌ | ❌ | ❌ |
| PARENT | ❌ | ❌ | ❌ | ❌ | ❌ |
| STUDENT | ❌ | ❌ | ❌ | ❌ | ❌ |

## Common Use Cases

### 1. Create a Multi-Student Tutoring Session
```javascript
const response = await fetch('/api/sessions/manage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Group Math Tutoring',
    provider: 'TEAMS',
    sessionMode: 'ONLINE',
    meetingLink: 'https://teams.microsoft.com/...',
    startTime: new Date('2024-03-20T10:00:00Z'),
    endTime: new Date('2024-03-20T11:00:00Z'),
    tutorId: 'tutor123',
    studentEnrollments: [
      { studentId: 'student1', courseId: 'course1', lessonId: 'lesson1' },
      { studentId: 'student2', courseId: 'course1', lessonId: 'lesson2' }
    ]
  })
});
```

### 2. View All Students in a Session
```javascript
const response = await fetch('/api/sessions/session123/students');
const students = await response.json();
```

### 3. Add a Student Mid-Session
```javascript
const response = await fetch('/api/sessions/session123/students', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: 'student3',
    courseId: 'course1',
    lessonId: 'lesson1'
  })
});
```

### 4. Update Student Progress
```javascript
const response = await fetch('/api/sessions/session123/students/student1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    completed: true,
    notes: 'Excellent progress today',
    assessmentData: { score: 95 }
  })
});
```

### 5. Remove a Student
```javascript
const response = await fetch('/api/sessions/session123/students/student1', {
  method: 'DELETE'
});
```

## Database Schema

### StudentSessionEnrollment
```prisma
model StudentSessionEnrollment {
  id              String   @id @default(cuid())
  
  sessionId       String
  session         Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  studentId       String
  student         User     @relation("StudentEnrollments", fields: [studentId], references: [id], onDelete: Cascade)
  
  courseId        String?
  course          Course?  @relation("SessionEnrollments", fields: [courseId], references: [id], onDelete: SetNull)
  
  lessonId        String?
  lesson          Lesson?  @relation("SessionEnrollments", fields: [lessonId], references: [id], onDelete: SetNull)
  
  exerciseContent Json?
  assessmentData  Json?
  
  completed       Boolean  @default(false)
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([sessionId, studentId])
  @@index([sessionId])
  @@index([studentId])
  @@index([courseId])
  @@index([lessonId])
}
```

## Error Handling

All endpoints return consistent error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```
or
```json
{
  "error": "You can only manage students in your own sessions"
}
```

### 404 Not Found
```json
{
  "error": "Session not found"
}
```

### 400 Bad Request
```json
{
  "error": "Missing required fields: title, provider, sessionMode, startTime, tutorId"
}
```

### 409 Conflict
```json
{
  "error": "Student is already enrolled in this session"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create session"
}
```
