**Document 6**, written as a standalone, production‑grade specification. This document goes deep into **role‑specific features**, defining exactly what each user type can see, do, and manage. It’s the bridge between user journeys (Document 5) and UI/UX wireframes (Document 7).

---

# 📄 **Document 6 — Role‑Specific Feature Documents**  
*Part of the LMS Documentation Suite*  
*Links:*  
- Master Index  
- Document 1: System Overview & Vision  
- Document 2: Technical Architecture Specification  
- Document 3: API Specification  
- Document 4: Database Schema & Data Models  
- Document 5: User Journeys  
- Document 7: UI/UX Wireframes (next)

---

# **1. Purpose of This Document**

This document defines the **complete feature set** for each role in the LMS ecosystem. It is intended for:

- Product managers  
- UX designers  
- Backend and frontend engineers  
- QA teams  
- Centre operators  
- Training and onboarding teams  

Each role has a dedicated section with:

- Feature overview  
- Permissions  
- Functional requirements  
- Edge cases  
- Cross‑role interactions  

---

# **2. Roles Covered**

This document includes feature specifications for:

1. Students  
2. Tutors  
3. Supervisors  
4. Centre Administrators  
5. Global Administrators  
6. Assessors  
7. Finance Teams  
8. Parents/Guardians  
9. Support Desk Staff  
10. Inventory/IT Staff  

---

# **3. Student Portal — Feature Specification**

## **3.1 Dashboard**
Features:
- Today’s classes  
- Upcoming classes  
- Gamification progress  
- Assignments due  
- Notifications  
- Messages from tutor  

Permissions:
- Read‑only for class schedule  
- Read/write for assignments  
- Read‑only for progress  

## **3.2 Class Participation**
Features:
- Join class  
- View class materials  
- Submit homework  
- View lesson summaries  

Edge Cases:
- Offline mode (centre server)  
- Tutor unavailable → auto‑redistribution  

## **3.3 Progress & Analytics**
Features:
- Academic age breakdown  
- Assessment results  
- Lesson history  
- Tutor feedback  

## **3.4 Requests**
Students can submit:
- IT issues  
- Resource requests  
- Class rescheduling  
- Complaints  

---

# **4. Tutor Portal — Feature Specification**

## **4.1 Dashboard**
Features:
- Today’s classes  
- Student list  
- Alerts (missed sessions, overdue assessments)  
- Workload summary  

## **4.2 Class Management**
Features:
- Start class  
- Take attendance  
- Upload class materials  
- Write lesson summaries  
- Assign homework  

## **4.3 Student Insights**
Features:
- Academic age  
- Special‑needs notes  
- Last 5 lessons summary  
- Behaviour notes  

## **4.4 Assessments**
Features:
- Create assessments  
- Mark assessments  
- Update academic age  

## **4.5 Tutor Availability**
Features:
- Set availability  
- Mark unavailability  
- Request schedule changes  

Edge Cases:
- Overloaded tutors → supervisor intervention  

---

# **5. Supervisor Console — Feature Specification**

## **5.1 Dashboard**
Features:
- Tutor performance  
- Student progress  
- Class schedules  
- Alerts (overload, missed classes)  

## **5.2 Class Oversight**
Features:
- View live class status  
- Join sessions silently (if allowed)  
- Reassign tutors  
- Redistribute students  

## **5.3 Approvals**
Supervisors approve:
- Rescheduling requests  
- Resource requests  
- Assessment overrides  

## **5.4 Escalation Handling**
Features:
- Behavioural issues  
- Complaints  
- Parent concerns  

---

# **6. Centre Administrator Console — Feature Specification**

## **6.1 Dashboard**
Features:
- Centre KPIs  
- Staff list  
- Student list  
- Finance summary  
- Inventory status  

## **6.2 User Management**
Features:
- Create users  
- Assign roles  
- Reset passwords  
- Deactivate accounts  

## **6.3 Class Management**
Features:
- Create class schedules  
- Assign tutors  
- Move students between classes  

## **6.4 Finance**
Features:
- Record payments  
- Process payroll  
- Track expenses  
- Approve reimbursements  

## **6.5 Inventory & Requests**
Features:
- Manage IT requests  
- Manage maintenance requests  
- Restock consumables  

---

# **7. Global Administrator Console — Feature Specification**

## **7.1 Multi‑Region Dashboard**
Features:
- All centres  
- Regional KPIs  
- Compliance alerts  
- System‑wide health  

## **7.2 Configuration**
Features:
- Feature toggles  
- Regional rules  
- Data residency settings  
- Global integrations  

## **7.3 Oversight**
Features:
- Centre performance  
- Tutor‑student ratios  
- Financial health  

---

# **8. Assessor Portal — Feature Specification**

## **8.1 Dashboard**
Features:
- Pending assessments  
- New enrolments  
- Academic age evaluations  

## **8.2 Assessment Management**
Features:
- Mark exams  
- Override tutor assessments  
- Recommend student placement  

## **8.3 Enrolment Workflow**
Features:
- Initial evaluation  
- Tutor assignment recommendations  
- Special‑needs flags  

---

# **9. Finance Portal — Feature Specification**

## **9.1 Dashboard**
Features:
- Payments  
- Payroll  
- Expenses  
- Centre profitability  

## **9.2 Payment Processing**
Features:
- Record payments  
- Reconcile transactions  
- Generate invoices  

## **9.3 Payroll**
Features:
- Tutor salaries  
- Support staff payments  
- Reimbursements  

---

# **10. Parent/Guardian Portal — Feature Specification**

## **10.1 Dashboard**
Features:
- Child’s schedule  
- Progress reports  
- Payments  
- Tutor notes  

## **10.2 Requests**
Parents can request:
- Class rescheduling  
- Tutor change  
- Meeting with supervisor  

## **10.3 Notifications**
Parents receive:
- Class reminders  
- Assessment results  
- Payment reminders  

---

# **11. Support Desk Portal — Feature Specification**

## **11.1 Ticket Management**
Features:
- View open tickets  
- Assign tickets  
- Update status  
- Add resolution notes  

## **11.2 Categories**
- IT  
- Maintenance  
- Inventory  
- Complaints  

---

# **12. Inventory/IT Staff Portal — Feature Specification**

## **12.1 Dashboard**
Features:
- Open requests  
- Asset list  
- Repair queue  

## **12.2 Actions**
Features:
- Update asset condition  
- Mark repairs complete  
- Request new stock  

---

# **13. Cross‑Role Feature Interactions**

## **13.1 Tutor Unavailability**
- Tutor marks unavailable  
- Supervisor reviews  
- System redistributes students  
- Students + parents notified  

## **13.2 Student Reassignment**
- Parent requests change  
- Supervisor reviews  
- System checks compatibility  
- New tutor assigned  
- History transferred  

## **13.3 Class Cancellation**
- Tutor cancels  
- Supervisor approves  
- Students redistributed or rescheduled  

---

# **14. Links to Other Documents**

- Document 1: System Overview  
- Document 2: Technical Architecture  
- Document 3: API Specification  
- Document 4: Database Schema  
- Document 5: User Journeys  
- **Document 7: UI/UX Wireframes (next)**  
- Document 8: Infrastructure & DevOps  
- Document 9: Roadmap & Delivery Plan  

---
