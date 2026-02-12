**Document D**, the **Full Data Dictionary**, written as a standalone, production‑grade reference. This is the kind of document DBAs, backend engineers, data analysts, BI teams, and compliance auditors rely on. It complements the database schema (Document 4) but goes deeper into **field‑level definitions**, **data types**, **validation rules**, **business meaning**, and **usage notes**.


---

# 📄 **Document D — Full Data Dictionary**  
*Part of the LMS Extended Deliverables Suite*  
*Links:*  
- Consolidated PDF‑Style Version  
- Document B: GitHub Folder Structure  
- Document C: Pitch Deck  
- Document E: Branding/Style Guide (next)  
- Document F: Centre Onboarding Manual  

---

# **1. Purpose of This Document**

This Data Dictionary defines **every major data element** in the LMS platform:

- Field names  
- Data types  
- Allowed values  
- Validation rules  
- Business definitions  
- Relationships  
- Usage notes  
- Security classification  

It ensures consistency across:

- Backend services  
- Frontend portals  
- Analytics pipelines  
- Integrations  
- Compliance audits  

This is the authoritative reference for all data stored, processed, or transmitted by the LMS.

---

# **2. Data Classification Levels**

| Level | Description | Examples |
|-------|-------------|----------|
| **Public** | Safe for public exposure | Feature descriptions |
| **Internal** | Non‑sensitive operational data | Class IDs |
| **Confidential** | Personal or sensitive data | Student profiles |
| **Restricted** | Highly sensitive data | Payment details, special‑needs data |

---

# **3. Entity‑Level Data Dictionaries**

Each section corresponds to a major table/entity in the LMS.

---

# **3.1 Users Table**

### **Purpose**  
Stores all user accounts across all roles.

### **Fields**

| Field | Type | Description | Validation | Classification |
|-------|------|-------------|------------|----------------|
| id | UUID | Unique identifier | Required | Internal |
| tenant_id | UUID | Centre/region identifier | Required | Internal |
| name | text | Full name | 1–200 chars | Confidential |
| email | text | Login email | Unique, valid email | Confidential |
| phone | text | Contact number | Optional | Confidential |
| role | enum | User role | student, tutor, admin, etc. | Internal |
| password_hash | text | Hashed password | Required | Restricted |
| language_preferences | jsonb | Preferred languages | ISO language codes | Internal |
| accessibility_settings | jsonb | Screen reader, contrast, etc. | Optional | Internal |
| status | enum | Account status | active, inactive | Internal |
| created_at | timestamp | Creation time | Auto | Internal |
| updated_at | timestamp | Last update | Auto | Internal |
| deleted_at | timestamp | Soft delete | Optional | Internal |

---

# **3.2 Students Table**

### **Purpose**  
Stores student‑specific academic and personal data.

### **Fields**

| Field | Type | Description | Validation | Classification |
|-------|------|-------------|------------|----------------|
| id | UUID | Student ID | Required | Internal |
| user_id | UUID | FK to users | Required | Confidential |
| centre_id | UUID | FK to centres | Required | Internal |
| dob | date | Date of birth | Required | Confidential |
| academic_age | jsonb | Reading, spelling, numeracy ages | Numeric values | Confidential |
| special_needs | jsonb | Autism, ADHD, etc. | Optional | Restricted |
| assigned_tutor_id | UUID | FK to tutors | Optional | Internal |
| parent_id | UUID | FK to users | Optional | Confidential |
| languages | jsonb | Languages spoken | ISO codes | Internal |
| history | jsonb | Last 5 lessons summary | Optional | Internal |
| created_at | timestamp | Creation time | Auto | Internal |
| updated_at | timestamp | Last update | Auto | Internal |

---

# **3.3 Tutors Table**

### **Purpose**  
Stores tutor‑specific data.

### **Fields**

| Field | Type | Description | Validation | Classification |
|-------|------|-------------|------------|----------------|
| id | UUID | Tutor ID | Required | Internal |
| user_id | UUID | FK to users | Required | Confidential |
| centre_id | UUID | FK to centres | Required | Internal |
| subjects | jsonb | Subjects taught | Array of strings | Internal |
| max_students | int | Capacity | >0 | Internal |
| current_students | int | Current load | >=0 | Internal |
| availability | jsonb | Weekly schedule | Optional | Internal |
| created_at | timestamp | Creation time | Auto | Internal |
| updated_at | timestamp | Last update | Auto | Internal |

---

# **3.4 Classes Table**

### **Purpose**  
Stores class sessions.

### **Fields**

| Field | Type | Description | Validation | Classification |
|-------|------|-------------|------------|----------------|
| id | UUID | Class ID | Required | Internal |
| centre_id | UUID | FK to centres | Required | Internal |
| tutor_id | UUID | FK to tutors | Required | Internal |
| student_ids | jsonb | List of students | Array of UUIDs | Internal |
| schedule | jsonb | Start, end, recurring | Required | Internal |
| status | enum | Class status | scheduled, completed, cancelled | Internal |
| meeting_provider | enum | Video provider | teams, zoom, chime | Internal |
| meeting_url | text | Join link | Optional | Confidential |
| created_at | timestamp | Creation time | Auto | Internal |
| updated_at | timestamp | Last update | Auto | Internal |

---

# **3.5 Assessments Table**

### **Purpose**  
Stores academic assessments.

### **Fields**

| Field | Type | Description | Validation | Classification |
|-------|------|-------------|------------|----------------|
| id | UUID | Assessment ID | Required | Internal |
| student_id | UUID | FK to students | Required | Confidential |
| tutor_id | UUID | FK to tutors | Required | Internal |
| type | enum | Assessment type | reading, spelling, numeracy, custom | Internal |
| score | int | Assessment score | 0–100 | Confidential |
| notes | text | Tutor notes | Optional | Confidential |
| created_at | timestamp | Creation time | Auto | Internal |
| updated_at | timestamp | Last update | Auto | Internal |

---

# **3.6 Gamification Table**

### **Purpose**  
Stores points, badges, and achievements.

### **Fields**

| Field | Type | Description | Classification |
|-------|------|-------------|----------------|
| id | UUID | Entry ID | Internal |
| student_id | UUID | FK to students | Confidential |
| points | int | Points awarded | Internal |
| badge | text | Badge name | Internal |
| metadata | jsonb | Additional info | Internal |
| created_at | timestamp | Timestamp | Internal |

---

# **3.7 Finance Records Table**

### **Purpose**  
Tracks payments, payroll, expenses, reimbursements.

### **Fields**

| Field | Type | Description | Classification |
|-------|------|-------------|----------------|
| id | UUID | Record ID | Internal |
| centre_id | UUID | FK to centres | Internal |
| student_id | UUID | FK to students | Confidential |
| tutor_id | UUID | FK to tutors | Confidential |
| amount | decimal | Amount | Restricted |
| type | enum | payment, salary, expense, reimbursement | Internal |
| method | enum | card, cash, transfer | Restricted |
| reference | text | Transaction reference | Restricted |
| created_at | timestamp | Timestamp | Internal |

---

# **3.8 Requests Table**

### **Purpose**  
Tracks IT, maintenance, inventory, complaints, rescheduling.

### **Fields**

| Field | Type | Description | Classification |
|-------|------|-------------|----------------|
| id | UUID | Request ID | Internal |
| centre_id | UUID | FK to centres | Internal |
| created_by | UUID | User who created request | Confidential |
| assigned_to | UUID | Staff assigned | Internal |
| type | enum | it, inventory, complaint, reschedule, maintenance | Internal |
| details | text | Description | Confidential |
| priority | enum | low, medium, high | Internal |
| status | enum | open, in_progress, resolved, closed | Internal |
| created_at | timestamp | Timestamp | Internal |
| updated_at | timestamp | Timestamp | Internal |

---

# **3.9 Inventory Table**

### **Purpose**  
Tracks assets and consumables.

### **Fields**

| Field | Type | Description | Classification |
|-------|------|-------------|----------------|
| id | UUID | Asset ID | Internal |
| centre_id | UUID | FK to centres | Internal |
| item_name | text | Name | Internal |
| category | enum | laptop, furniture, stationery, network, misc | Internal |
| quantity | int | Count | Internal |
| condition | enum | good, needs_repair, broken | Internal |
| metadata | jsonb | Additional info | Internal |
| created_at | timestamp | Timestamp | Internal |
| updated_at | timestamp | Timestamp | Internal |

---

# **3.10 Parent/Guardian Table**

### **Purpose**  
Stores parent/guardian relationships.

### **Fields**

| Field | Type | Description | Classification |
|-------|------|-------------|----------------|
| id | UUID | Relationship ID | Internal |
| user_id | UUID | Parent user | Confidential |
| student_id | UUID | Student | Confidential |
| relationship | enum | parent, guardian | Confidential |
| created_at | timestamp | Timestamp | Internal |

---

# **3.11 Notifications Table**

### **Purpose**  
Stores notification logs.

### **Fields**

| Field | Type | Description | Classification |
|-------|------|-------------|----------------|
| id | UUID | Notification ID | Internal |
| user_id | UUID | Recipient | Confidential |
| type | enum | email, sms, push | Internal |
| subject | text | Subject | Internal |
| message | text | Body | Confidential |
| status | enum | sent, failed | Internal |
| created_at | timestamp | Timestamp | Internal |

---

# **4. Derived Data & Analytics Fields**

These fields are computed, not stored directly.

| Field | Source | Description |
|-------|--------|-------------|
| student_engagement_score | Lessons, attendance, gamification | Engagement metric |
| tutor_load_index | Classes, max_students | Workload indicator |
| centre_profitability | Finance records | Revenue – expenses |
| academic_growth_rate | Assessments | Improvement over time |

---

# **5. Data Retention Policy**

| Data Type | Retention |
|-----------|-----------|
| Student academic data | 7 years |
| Financial records | 7 years |
| Class logs | 3 years |
| Video session metadata | 1 year |
| Support tickets | 2 years |

---

# ✔️ **Document D Complete**

This is a full, enterprise‑grade data dictionary ready for engineering, analytics, and compliance teams.

---
