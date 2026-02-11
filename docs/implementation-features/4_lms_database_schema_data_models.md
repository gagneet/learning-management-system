**Document 4**, written as a fully standalone, production‑grade specification. This is the database backbone of the entire LMS ecosystem. It’s structured so engineers, DBAs, and architects can implement it directly.

---

# 📄 **Document 4 — Database Schema & Data Models**  
*Part of the LMS Documentation Suite*  
*Links:*  
- Master Index  
- Document 1: System Overview & Vision  
- Document 2: Technical Architecture Specification  
- Document 3: API Specification  
- Document 5: User Journeys (next)

---

# **1. Database Design Principles**

### **1.1 Multi‑Tenant Architecture**
The LMS supports:
- Multi‑centre  
- Multi‑region  
- Multi‑country  

Tenancy is implemented using:
- `tenant_id` on all tables  
- Row‑Level Security (RLS)  
- Optional DB‑per‑region for data residency  

### **1.2 Normalization**
- 3NF for core transactional tables  
- JSONB for flexible fields (special needs, academic age, preferences)  

### **1.3 Auditability**
Every table includes:
- `created_at`  
- `updated_at`  
- `created_by`  
- `updated_by`  

### **1.4 Soft Deletes**
- `deleted_at` column for recoverability  

### **1.5 Performance**
- Indexes on foreign keys  
- Partial indexes for active records  
- Materialized views for analytics  

---

# **2. Entity‑Relationship Diagram (Textual)**

```
Users (1) ---------------- (1) Students
Users (1) ---------------- (1) Tutors
Users (1) ---------------- (1) Parents
Users (1) ---------------- (1) Staff

Students (1) ------------ (*) Classes
Tutors (1) -------------- (*) Classes

Students (1) ------------ (*) Assessments
Tutors (1) -------------- (*) Assessments

Centres (1) ------------- (*) Users
Centres (1) ------------- (*) Classes
Centres (1) ------------- (*) FinanceRecords
Centres (1) ------------- (*) Requests

Requests (*) ------------ (1) Staff (assigned_to)

Gamification (*) -------- (1) Students

Inventory (*) ----------- (1) Centres
```

---

# **3. Core Tables**

---

# **3.1 Users Table**

### Purpose  
Stores all user accounts (students, tutors, parents, admins, finance, assessors, support staff).

### Schema
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tenant_id | UUID | FK to centre/region |
| name | text | |
| email | text | unique |
| phone | text | nullable |
| role | enum | student, tutor, supervisor, admin, finance, parent, assessor, support |
| password_hash | text | |
| language_preferences | jsonb | ["en", "hi"] |
| accessibility_settings | jsonb | screen_reader, high_contrast |
| status | enum | active, inactive |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | soft delete |

---

# **3.2 Students Table**

### Purpose  
Stores student‑specific data.

### Schema
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK to users |
| centre_id | UUID | FK |
| dob | date | |
| academic_age | jsonb | reading, spelling, numeracy |
| special_needs | jsonb | ["Autism", "ADHD"] |
| assigned_tutor_id | UUID | FK |
| parent_id | UUID | FK to users |
| languages | jsonb | |
| history | jsonb | last 5 lessons summary |
| created_at | timestamp | |
| updated_at | timestamp | |

---

# **3.3 Tutors Table**

### Purpose  
Stores tutor‑specific data.

### Schema
| Column | Type |
|--------|------|
| id | UUID |
| user_id | UUID |
| centre_id | UUID |
| subjects | jsonb |
| max_students | int |
| current_students | int |
| availability | jsonb |
| created_at | timestamp |
| updated_at | timestamp |

---

# **3.4 Classes Table**

### Purpose  
Stores class sessions.

### Schema
| Column | Type |
|--------|------|
| id | UUID |
| centre_id | UUID |
| tutor_id | UUID |
| student_ids | jsonb |
| schedule | jsonb (start, end, recurring) |
| status | enum (scheduled, completed, cancelled) |
| meeting_provider | enum (teams, zoom, chime) |
| meeting_url | text |
| created_at | timestamp |
| updated_at | timestamp |

---

# **3.5 Assessments Table**

### Purpose  
Stores academic assessments.

### Schema
| Column | Type |
|--------|------|
| id | UUID |
| student_id | UUID |
| tutor_id | UUID |
| type | enum (reading, spelling, numeracy, custom) |
| score | int |
| notes | text |
| created_at | timestamp |
| updated_at | timestamp |

---

# **3.6 Gamification Table**

### Purpose  
Stores points, badges, and achievements.

### Schema
| Column | Type |
|--------|------|
| id | UUID |
| student_id | UUID |
| points | int |
| badge | text |
| metadata | jsonb |
| created_at | timestamp |

---

# **3.7 Finance Records Table**

### Purpose  
Tracks payments, payroll, expenses, reimbursements.

### Schema
| Column | Type |
|--------|------|
| id | UUID |
| centre_id | UUID |
| student_id | UUID nullable |
| tutor_id | UUID nullable |
| amount | decimal |
| type | enum (payment, salary, expense, reimbursement) |
| method | enum (card, cash, transfer) |
| reference | text |
| created_at | timestamp |

---

# **3.8 Requests Table**

### Purpose  
Tracks IT, inventory, complaints, rescheduling, repairs.

### Schema
| Column | Type |
|--------|------|
| id | UUID |
| centre_id | UUID |
| created_by | UUID |
| assigned_to | UUID nullable |
| type | enum (it, inventory, complaint, reschedule, maintenance) |
| details | text |
| priority | enum (low, medium, high) |
| status | enum (open, in_progress, resolved, closed) |
| created_at | timestamp |
| updated_at | timestamp |

---

# **3.9 Inventory Table**

### Purpose  
Tracks assets and consumables.

### Schema
| Column | Type |
|--------|------|
| id | UUID |
| centre_id | UUID |
| item_name | text |
| category | enum (laptop, furniture, stationery, network, misc) |
| quantity | int |
| condition | enum (good, needs_repair, broken) |
| metadata | jsonb |
| created_at | timestamp |
| updated_at | timestamp |

---

# **3.10 Parent/Guardian Table**

### Purpose  
Stores parent/guardian relationships.

### Schema
| Column | Type |
|--------|------|
| id | UUID |
| user_id | UUID |
| student_id | UUID |
| relationship | enum (parent, guardian) |
| created_at | timestamp |

---

# **3.11 Notifications Table**

### Purpose  
Stores notification logs.

### Schema
| Column | Type |
|--------|------|
| id | UUID |
| user_id | UUID |
| type | enum (email, sms, push) |
| subject | text |
| message | text |
| status | enum (sent, failed) |
| created_at | timestamp |

---

# **4. Indexing Strategy**

### **4.1 Common Indexes**
- `idx_users_email`  
- `idx_students_assigned_tutor`  
- `idx_classes_tutor_id`  
- `idx_finance_centre_id`  
- `idx_requests_status_priority`  

### **4.2 JSONB Indexes**
- GIN index on `academic_age`  
- GIN index on `special_needs`  
- GIN index on `subjects`  

---

# **5. Multi‑Tenant Isolation**

### **5.1 Row‑Level Security (RLS)**
Example policy:
```
USING (tenant_id = current_setting('app.tenant_id')::uuid)
```

### **5.2 Tenant‑Scoped Sequences**
- Separate ID sequences per tenant optional  

### **5.3 Data Residency**
- EU tenants stored in EU region  
- AU tenants stored in AU region  
- US tenants stored in US region  

---

# **6. Analytics Layer**

### **6.1 Materialized Views**
- `mv_student_progress`  
- `mv_tutor_load`  
- `mv_centre_financials`  

### **6.2 Event Sourcing**
Events stored in:
- `event_log` table  
- Used for replay and analytics  

---

# **7. Backup & Recovery**

### **7.1 Backup Strategy**
- Daily full backups  
- Hourly WAL archiving  
- Point‑in‑time recovery (PITR)  

### **7.2 Retention**
- 30 days for standard tenants  
- 7 years for regulated tenants  

---

# **8. Links to Other Documents**

- Document 1: System Overview  
- Document 2: Technical Architecture  
- Document 3: API Specification  
- **Document 5: User Journeys (next)**  
- Document 6: Role‑Specific Feature Documents  
- Document 7: UI/UX Wireframes  
- Document 8: Infrastructure & DevOps  
- Document 9: Roadmap & Delivery Plan  

---
