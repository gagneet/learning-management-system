**Document 5**, crafted as a standalone, deeply detailed, production‑ready specification. This one focuses entirely on **User Journeys & Experience Flows**, mapping how every role interacts with the LMS from first login to advanced workflows. It’s written so product managers, UX designers, and engineers can use it directly.

---

# 📄 **Document 5 — User Journeys & Experience Flows**  
*Part of the LMS Documentation Suite*  
*Links:*  
- Master Index  
- Document 1: System Overview & Vision  
- Document 2: Technical Architecture Specification  
- Document 3: API Specification  
- Document 4: Database Schema & Data Models  
- Document 6: Role‑Specific Feature Documents (next)

---

# **1. Purpose of This Document**

This document describes the **end‑to‑end journeys** for every major user role in the LMS. It focuses on:

- What each user is trying to achieve  
- How they move through the system  
- What data they interact with  
- What decisions they make  
- What system responses they receive  
- What edge cases or exceptions occur  

These journeys form the foundation for:

- UI/UX design  
- Feature prioritization  
- Workflow automation  
- API requirements  
- Role‑specific permissions  
- Training and onboarding  

---

# **2. User Journey Overview (All Roles)**

The LMS supports the following primary user groups:

- Students  
- Tutors  
- Supervisors  
- Centre Administrators  
- Global Administrators  
- Assessors  
- Finance Teams  
- Parents/Guardians  
- Support Desk Staff  
- Inventory/IT Staff  

Each role has a distinct journey, but many workflows intersect — especially around classes, assessments, requests, and finance.

---

# **3. Student Journey**

## **3.1 First Login**
1. Student receives login credentials from centre admin.  
2. Logs in and is prompted to:  
   - Set preferred language  
   - Configure accessibility settings (voice control, high contrast, dyslexia mode)  
3. Student sees the **Student Dashboard**.

## **3.2 Dashboard Experience**
The dashboard shows:
- Today’s classes  
- Upcoming classes  
- Gamification progress  
- Assignments  
- Notifications  
- Messages from tutor  

## **3.3 Joining a Class**
1. Student clicks “Join Class”.  
2. System selects provider (Teams/Zoom/Chime).  
3. Student enters the session.  
4. Attendance is automatically logged.  
5. Class materials appear in the sidebar.  

## **3.4 Completing Assignments**
1. Student opens assignment.  
2. Completes task (quiz, upload, interactive module).  
3. Submission triggers:  
   - Tutor notification  
   - Analytics update  
   - Gamification points  

## **3.5 Viewing Progress**
Student can view:
- Academic age  
- Lesson history  
- Assessment results  
- Tutor feedback  
- Achievements  

## **3.6 Requesting Help**
Student can submit:
- IT issues  
- Resource requests (paper, laptop repair)  
- Class rescheduling requests  

---

# **4. Tutor Journey**

## **4.1 First Login**
Tutor sets:
- Availability  
- Subjects taught  
- Preferred languages  

## **4.2 Dashboard**
Tutor sees:
- Today’s classes  
- Student list  
- Alerts (missed sessions, overdue assessments)  
- Workload summary  

## **4.3 Preparing for Class**
Tutor reviews:
- Student academic levels  
- Last 5 lesson summaries  
- Special‑needs notes  
- Learning goals  

## **4.4 Running a Class**
1. Tutor starts session.  
2. Students join.  
3. Tutor uses tools:  
   - Whiteboard  
   - File sharing  
   - Polls  
   - Breakout rooms  
4. Tutor logs notes per student.  

## **4.5 After Class**
Tutor completes:
- Attendance confirmation  
- Lesson summary  
- Homework assignment  
- Behaviour notes (optional)  

## **4.6 Assessments**
Tutor can:
- Create assessments  
- Mark assessments  
- Update academic age  

## **4.7 Handling Exceptions**
Tutor may need to:
- Report student absence  
- Request class redistribution  
- Flag concerns to supervisor  

---

# **5. Supervisor Journey**

## **5.1 Dashboard**
Supervisor sees:
- Tutor performance  
- Student progress  
- Class schedules  
- Alerts (overloaded tutors, missed classes)  

## **5.2 Monitoring Classes**
Supervisor can:
- View live class status  
- Join sessions silently (if permitted)  
- Reassign tutors  
- Redistribute students  

## **5.3 Handling Escalations**
Supervisor manages:
- Complaints  
- Behavioural issues  
- Tutor unavailability  
- Parent concerns  

## **5.4 Approvals**
Supervisor approves:
- Rescheduling requests  
- Resource requests  
- Assessment overrides  

---

# **6. Centre Administrator Journey**

## **6.1 Dashboard**
Admin sees:
- Centre‑level KPIs  
- Staff list  
- Student list  
- Finance summary  
- Inventory status  

## **6.2 Managing Users**
Admin can:
- Create users  
- Assign roles  
- Reset passwords  
- Deactivate accounts  

## **6.3 Managing Classes**
Admin can:
- Create class schedules  
- Assign tutors  
- Move students between classes  

## **6.4 Finance**
Admin handles:
- Student payments  
- Tutor payroll  
- Centre expenses  
- Reimbursements  

## **6.5 Inventory & Requests**
Admin oversees:
- IT requests  
- Maintenance requests  
- Consumable restocking  

---

# **7. Global Administrator Journey**

## **7.1 Multi‑Region Dashboard**
Global admin sees:
- All centres  
- Regional KPIs  
- Compliance alerts  
- System‑wide settings  

## **7.2 Configuration**
Global admin configures:
- Feature toggles  
- Regional rules  
- Data residency policies  
- Global integrations  

## **7.3 Oversight**
Global admin monitors:
- Centre performance  
- Tutor‑student ratios  
- Financial health  
- System uptime  

---

# **8. Assessor Journey**

## **8.1 Dashboard**
Assessor sees:
- Pending assessments  
- New enrolments  
- Academic age evaluations  

## **8.2 Reviewing Assessments**
Assessor can:
- Mark exams  
- Override tutor assessments  
- Recommend student placement  

## **8.3 Enrolment Workflow**
Assessor handles:
- Initial student evaluation  
- Tutor assignment recommendations  
- Special‑needs flags  

---

# **9. Finance Team Journey**

## **9.1 Dashboard**
Finance sees:
- Payments  
- Payroll  
- Expenses  
- Centre profitability  

## **9.2 Payment Processing**
Finance can:
- Record payments  
- Reconcile transactions  
- Generate invoices  

## **9.3 Payroll**
Finance manages:
- Tutor salaries  
- Support staff payments  
- Reimbursements  

---

# **10. Parent/Guardian Journey**

## **10.1 Dashboard**
Parent sees:
- Child’s schedule  
- Progress reports  
- Payments  
- Tutor notes  

## **10.2 Requests**
Parent can request:
- Class rescheduling  
- Tutor change  
- Meeting with supervisor  

## **10.3 Notifications**
Parent receives:
- Class reminders  
- Assessment results  
- Payment reminders  

---

# **11. Support Desk Journey**

## **11.1 Ticket Management**
Support staff handle:
- IT issues  
- Maintenance requests  
- Inventory shortages  

## **11.2 Workflow**
1. Ticket assigned  
2. Staff updates status  
3. Resolution logged  
4. User notified  

---

# **12. Inventory/IT Staff Journey**

## **12.1 Dashboard**
Staff sees:
- Open requests  
- Asset list  
- Repair queue  

## **12.2 Actions**
Staff can:
- Update asset condition  
- Mark repairs complete  
- Request new stock  

---

# **13. Cross‑Role Interaction Flows**

## **13.1 Tutor Unavailability**
1. Tutor marks unavailable  
2. System triggers redistribution  
3. Supervisor reviews  
4. Students notified  
5. Parent notified  

## **13.2 Student Reassignment**
1. Parent requests tutor change  
2. Supervisor reviews  
3. System checks tutor compatibility  
4. New tutor assigned  
5. History transferred  

## **13.3 Class Cancellation**
1. Tutor cancels  
2. Supervisor approves  
3. Students redistributed or class rescheduled  

---

# **14. Links to Other Documents**

- Document 1: System Overview  
- Document 2: Technical Architecture  
- Document 3: API Specification  
- Document 4: Database Schema  
- **Document 6: Role‑Specific Feature Documents (next)**  
- Document 7: UI/UX Wireframes  
- Document 8: Infrastructure & DevOps  
- Document 9: Roadmap & Delivery Plan  

---
