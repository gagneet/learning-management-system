**Document 3**, the **Full API Specification**, written as a standalone, production‑grade reference. It’s structured so you can hand it directly to backend engineers, integrators, or vendors. It links cleanly to the master index and previous documents.

---

# 📄 **Document 3 — Full API Specification (REST API Reference)**  
*Part of the LMS Documentation Suite*  
*Links:*  
- Master Index  
- Document 1: System Overview & Vision  
- Document 2: Technical Architecture Specification  
- Document 4: Database Schema & Data Models (next)

---

# **1. API Design Principles**

The LMS API follows these principles:

### **1.1 RESTful Architecture**
- Resource‑oriented endpoints  
- Standard HTTP verbs (GET, POST, PUT, PATCH, DELETE)  
- Predictable URL patterns  

### **1.2 JSON Everywhere**
- All requests and responses use JSON  
- Errors follow a unified JSON error format  

### **1.3 Multi‑Tenant Awareness**
Every request includes:
- `X-Tenant-ID` (centre or region)  
- `X-User-Role` (optional override for admin tools)  

### **1.4 Authentication**
- JWT access tokens  
- Refresh tokens  
- Optional SSO (Azure AD, Google Workspace)  

### **1.5 Versioning**
All endpoints are versioned:
```
/api/v1/students
/api/v1/classes
```

### **1.6 Pagination & Filtering**
Standard query parameters:
```
?page=1&limit=20&sort=name&filter=status:active
```

---

# **2. Authentication & Authorization APIs**

## **2.1 POST /auth/login**
Authenticate a user and return tokens.

### Request
```json
{
  "email": "string",
  "password": "string",
  "deviceId": "string"
}
```

### Response
```json
{
  "token": "jwt-token",
  "refreshToken": "string",
  "expiresIn": 3600,
  "roles": ["student", "tutor"]
}
```

---

## **2.2 POST /auth/refresh**
Refresh the access token.

### Request
```json
{
  "refreshToken": "string"
}
```

### Response
```json
{
  "token": "jwt-token",
  "expiresIn": 3600
}
```

---

## **2.3 GET /auth/me**
Returns the authenticated user’s profile.

### Response
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "roles": ["tutor"],
  "centreId": "uuid",
  "languagePreferences": ["en", "hi"]
}
```

---

# **3. User Management APIs**

## **3.1 GET /users**
List users with filters.

### Query Parameters
```
role=student|tutor|admin
centreId=uuid
status=active|inactive
```

### Response
```json
[
  {
    "id": "uuid",
    "name": "string",
    "role": "tutor",
    "centreId": "uuid"
  }
]
```

---

## **3.2 POST /users**
Create a new user.

### Request
```json
{
  "name": "string",
  "email": "string",
  "role": "tutor",
  "centreId": "uuid",
  "languagePreferences": ["en"]
}
```

---

# **4. Student APIs**

## **4.1 GET /students/{id}**
Retrieve full student profile.

### Response
```json
{
  "id": "uuid",
  "userId": "uuid",
  "dob": "date",
  "academicAge": {
    "reading": 8,
    "spelling": 7,
    "numeracy": 9
  },
  "specialNeeds": ["Autism"],
  "assignedTutor": "uuid",
  "languages": ["English"],
  "history": [
    {
      "lessonId": "uuid",
      "summary": "string",
      "date": "date"
    }
  ]
}
```

---

## **4.2 POST /students**
Create a student profile.

### Request
```json
{
  "userId": "uuid",
  "dob": "date",
  "specialNeeds": ["ADHD"],
  "languages": ["English", "Hindi"]
}
```

---

## **4.3 PATCH /students/{id}/assign-tutor**
Assign or reassign a tutor.

### Request
```json
{
  "tutorId": "uuid",
  "reason": "Parent request"
}
```

---

# **5. Tutor APIs**

## **5.1 GET /tutors/{id}**
Retrieve tutor profile.

### Response
```json
{
  "id": "uuid",
  "userId": "uuid",
  "subjects": ["Math", "Science"],
  "maxStudents": 10,
  "currentStudents": 7
}
```

---

## **5.2 GET /tutors/{id}/students**
List students assigned to a tutor.

---

# **6. Class Scheduling APIs**

## **6.1 POST /classes**
Create a class session.

### Request
```json
{
  "tutorId": "uuid",
  "studentIds": ["uuid1", "uuid2"],
  "schedule": {
    "start": "2026-02-10T10:00:00Z",
    "end": "2026-02-10T11:00:00Z",
    "recurring": "weekly"
  }
}
```

---

## **6.2 PATCH /classes/{id}/cancel**
Cancel a class.

### Request
```json
{
  "reason": "Tutor unavailable"
}
```

---

## **6.3 POST /classes/{id}/redistribute**
Redistribute students when a tutor is unavailable.

### Response
```json
{
  "redistributedTo": [
    {
      "studentId": "uuid",
      "newTutorId": "uuid"
    }
  ]
}
```

---

# **7. Assessment APIs**

## **7.1 POST /assessments**
Create an assessment.

### Request
```json
{
  "studentId": "uuid",
  "type": "reading",
  "score": 85,
  "notes": "Good comprehension"
}
```

---

## **7.2 GET /assessments/student/{id}**
List assessments for a student.

---

# **8. Gamification APIs**

## **8.1 POST /gamification/award**
Award points or badges.

### Request
```json
{
  "studentId": "uuid",
  "points": 50,
  "badge": "Math Master"
}
```

---

# **9. Finance APIs**

## **9.1 POST /finance/payment**
Record a student payment.

### Request
```json
{
  "studentId": "uuid",
  "amount": 120.00,
  "method": "card",
  "reference": "string"
}
```

---

## **9.2 POST /finance/payroll**
Record tutor payroll.

---

## **9.3 GET /finance/centre/{id}/summary**
Centre‑level financial summary.

---

# **10. Request & Support APIs**

## **10.1 POST /requests**
Create a request.

### Request
```json
{
  "type": "it",
  "createdBy": "uuid",
  "centreId": "uuid",
  "details": "Laptop not turning on",
  "priority": "high"
}
```

---

## **10.2 PATCH /requests/{id}/assign**
Assign a request to staff.

---

## **10.3 PATCH /requests/{id}/resolve**
Resolve a request.

---

# **11. Communication Integration APIs**

## **11.1 POST /communication/start-session**
Start a video session.

### Request
```json
{
  "provider": "teams",
  "classId": "uuid"
}
```

### Response
```json
{
  "meetingUrl": "string",
  "providerSessionId": "string"
}
```

---

# **12. Notification APIs**

## **12.1 POST /notifications/send**
Send a notification.

### Request
```json
{
  "userId": "uuid",
  "type": "email",
  "subject": "Class Reminder",
  "message": "Your class starts in 30 minutes."
}
```

---

# **13. File Storage APIs**

## **13.1 POST /files/upload**
Upload a file.

---

## **13.2 GET /files/{id}**
Retrieve a file.

---

# **14. Error Format**

All errors follow this structure:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

---

# **15. Links to Other Documents**

- Document 1: System Overview & Vision  
- Document 2: Technical Architecture  
- **Document 4: Database Schema & Data Models (next)**  
- Document 5: User Journeys  
- Document 6: Role‑Specific Feature Documents  
- Document 7: UI/UX Wireframes  
- Document 8: Infrastructure & DevOps  
- Document 9: Roadmap & Delivery Plan  

---
