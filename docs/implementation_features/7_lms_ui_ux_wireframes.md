**Document 7**, crafted as a standalone, professional‑grade specification. This one focuses entirely on **UI/UX Wireframe Descriptions**, written so designers, frontend engineers, accessibility specialists, and product managers can use it directly.

---

# 📄 **Document 7 — UI/UX Wireframe Descriptions**  
*Part of the LMS Documentation Suite*  
*Links:*  
- Master Index  
- Document 1: System Overview & Vision  
- Document 2: Technical Architecture Specification  
- Document 3: API Specification  
- Document 4: Database Schema & Data Models  
- Document 5: User Journeys  
- Document 6: Role‑Specific Feature Documents  
- Document 8: Infrastructure & DevOps (next)

---

# **1. Purpose of This Document**

This document provides **text‑based wireframe descriptions** for all major screens in the LMS. These descriptions define:

- Layout  
- Navigation structure  
- Key UI components  
- Accessibility requirements  
- Special‑needs considerations  
- Multi‑lingual and multi‑region UI behaviour  

These wireframes are intentionally **tool‑agnostic**, so they can be implemented in Figma, Adobe XD, Sketch, or any design system.

---

# **2. Global UI/UX Principles**

### **2.1 Consistency**
- Unified design system across all portals  
- Shared components (buttons, cards, tables, modals)  

### **2.2 Accessibility**
- WCAG 2.2 AA compliance  
- Screen reader compatibility  
- Keyboard navigation  
- High‑contrast mode  
- Dyslexia‑friendly font option  
- Voice‑control compatibility  
- Large‑text mode  

### **2.3 Multi‑Lingual Support**
- Dynamic text expansion  
- Right‑to‑left layout support (Arabic, Hebrew)  
- Per‑user language preference  

### **2.4 Special‑Needs Support**
- Visual impairment modes  
- Autism‑friendly UI (reduced animations, predictable layouts)  
- ADHD‑friendly UI (reduced clutter, focus mode)  

### **2.5 Responsive Design**
- Mobile  
- Tablet  
- Desktop  
- Large classroom displays  

---

# **3. Navigation Structure (Global)**

```
Top Navigation Bar:
    - Logo
    - Portal Switcher (if user has multiple roles)
    - Notifications (bell icon)
    - Messages (chat icon)
    - Profile Menu (avatar)

Left Sidebar (role-specific):
    - Dashboard
    - Classes
    - Students / Tutors
    - Assessments
    - Finance
    - Requests
    - Settings
```

---

# **4. Student Portal — Wireframes**

## **4.1 Student Dashboard**

```
---------------------------------------------------------------
| Header: "Welcome, {Student Name}"                           |
---------------------------------------------------------------
| Row 1:                                                      |
|   [Today's Classes Card]   [Upcoming Classes Card]          |
---------------------------------------------------------------
| Row 2:                                                      |
|   [Gamification Progress]  [Assignments Due]                |
---------------------------------------------------------------
| Row 3:                                                      |
|   [Notifications Feed]                                      |
---------------------------------------------------------------
```

### Key UI Elements
- Class cards with join buttons  
- Progress ring for gamification  
- Assignment list with due dates  
- Notification feed with icons  

### Accessibility Notes
- Large join button  
- Voice command: “Join next class”  

---

## **4.2 Class Session Screen**

```
---------------------------------------------------------------
| Video Area (full width)                                     |
---------------------------------------------------------------
| Left Sidebar:                                               |
|   - Participants                                             |
|   - Chat                                                     |
|   - Materials                                                |
---------------------------------------------------------------
| Bottom Bar:                                                 |
|   - Mic | Camera | Raise Hand | Reactions | Leave           |
---------------------------------------------------------------
```

### Special‑Needs Features
- High‑contrast video controls  
- “Focus Mode” hides chat and participants  

---

## **4.3 Student Progress Screen**

```
---------------------------------------------------------------
| Academic Age Summary (Reading | Spelling | Numeracy)        |
---------------------------------------------------------------
| Graph: Progress Over Time                                   |
---------------------------------------------------------------
| Lesson History (List View)                                  |
---------------------------------------------------------------
```

---

# **5. Tutor Portal — Wireframes**

## **5.1 Tutor Dashboard**

```
---------------------------------------------------------------
| Header: "Today's Schedule"                                  |
---------------------------------------------------------------
| Row 1:                                                      |
|   [Next Class Card]   [Workload Summary Card]               |
---------------------------------------------------------------
| Row 2:                                                      |
|   [Student Alerts]   [Pending Assessments]                  |
---------------------------------------------------------------
```

### Components
- Class timeline  
- Student performance alerts  
- Assessment queue  

---

## **5.2 Student Profile (Tutor View)**

```
---------------------------------------------------------------
| Student Name | Academic Age | Special Needs Badges          |
---------------------------------------------------------------
| Tabs: Overview | History | Assessments | Notes              |
---------------------------------------------------------------
| Overview Tab:                                      |
|   - Last 5 Lessons Summary                         |
|   - Current Level                                  |
|   - Goals                                          |
---------------------------------------------------------------
```

---

# **6. Supervisor Console — Wireframes**

## **6.1 Supervisor Dashboard**

```
---------------------------------------------------------------
| KPIs: Tutor Load | Student Progress | Missed Classes         |
---------------------------------------------------------------
| Alerts Panel (High Priority First)                          |
---------------------------------------------------------------
| Tutor Overview Table                                         |
---------------------------------------------------------------
```

---

## **6.2 Class Oversight Screen**

```
---------------------------------------------------------------
| Class List (Filter: Today | Week | Month)                   |
---------------------------------------------------------------
| Class Card:                                                 |
|   - Tutor                                                   |
|   - Students                                                |
|   - Status (Live, Scheduled, Missed)                        |
|   - Actions: Reassign | Join | Cancel                       |
---------------------------------------------------------------
```

---

# **7. Centre Administrator Console — Wireframes**

## **7.1 Admin Dashboard**

```
---------------------------------------------------------------
| Centre KPIs:                                                |
|   - Active Students                                         |
|   - Active Tutors                                           |
|   - Monthly Revenue                                         |
|   - Outstanding Requests                                    |
---------------------------------------------------------------
| Quick Actions:                                              |
|   - Add Student                                             |
|   - Add Tutor                                               |
|   - Create Class                                            |
---------------------------------------------------------------
```

---

## **7.2 User Management Screen**

```
---------------------------------------------------------------
| Search Bar                                                  |
---------------------------------------------------------------
| Table:                                                      |
|   Name | Role | Centre | Status | Actions (Edit/Delete)     |
---------------------------------------------------------------
| Add User Button                                             |
---------------------------------------------------------------
```

---

# **8. Global Administrator Console — Wireframes**

## **8.1 Global Dashboard**

```
---------------------------------------------------------------
| World Map with Regions                                      |
---------------------------------------------------------------
| Region Cards:                                               |
|   - Centres Count                                           |
|   - Students                                                |
|   - Revenue                                                 |
|   - Alerts                                                  |
---------------------------------------------------------------
```

---

## **8.2 Feature Toggle Screen**

```
---------------------------------------------------------------
| Feature List:                                               |
|   - Gamification [On/Off]                                   |
|   - Parent Portal [On/Off]                                  |
|   - Offline Mode [On/Off]                                   |
|   - Multi-Lingual [On/Off]                                  |
---------------------------------------------------------------
```

---

# **9. Assessor Portal — Wireframes**

## **9.1 Assessment Queue**

```
---------------------------------------------------------------
| Filters: Pending | Completed | Overdue                      |
---------------------------------------------------------------
| Assessment Cards:                                           |
|   - Student Name                                            |
|   - Type                                                    |
|   - Score (if completed)                                    |
|   - Actions: Review | Mark                                  |
---------------------------------------------------------------
```

---

# **10. Finance Portal — Wireframes**

## **10.1 Finance Dashboard**

```
---------------------------------------------------------------
| Revenue Summary | Expenses Summary | Profitability           |
---------------------------------------------------------------
| Payment Queue (Pending)                                     |
---------------------------------------------------------------
| Payroll Overview                                             |
---------------------------------------------------------------
```

---

# **11. Parent/Guardian Portal — Wireframes**

## **11.1 Parent Dashboard**

```
---------------------------------------------------------------
| Child Selector (if multiple children)                       |
---------------------------------------------------------------
| Child Overview:                                             |
|   - Next Class                                              |
|   - Progress Summary                                        |
|   - Payments Due                                            |
---------------------------------------------------------------
| Notifications                                               |
---------------------------------------------------------------
```

---

# **12. Support Desk Portal — Wireframes**

## **12.1 Ticket Management**

```
---------------------------------------------------------------
| Filters: IT | Maintenance | Inventory | Complaints           |
---------------------------------------------------------------
| Ticket Table:                                               |
|   - ID | Type | Priority | Status | Assigned To | Actions    |
---------------------------------------------------------------
```

---

# **13. Inventory/IT Staff Portal — Wireframes**

## **13.1 Asset List**

```
---------------------------------------------------------------
| Search Bar                                                  |
---------------------------------------------------------------
| Table:                                                      |
|   Item | Category | Condition | Quantity | Actions           |
---------------------------------------------------------------
```

---

# **14. Accessibility Wireframes**

## **14.1 High‑Contrast Mode**
- Dark background  
- Bright, high‑contrast text  
- Thick borders  
- Reduced animations  

## **14.2 Dyslexia Mode**
- OpenDyslexic or Lexend font  
- Increased line spacing  
- Reduced clutter  

## **14.3 Visual Impairment Mode**
- Large text  
- Voice navigation  
- Screen reader‑optimized labels  

---

# **15. Links to Other Documents**

- Document 1: System Overview  
- Document 2: Technical Architecture  
- Document 3: API Specification  
- Document 4: Database Schema  
- Document 5: User Journeys  
- Document 6: Role‑Specific Features  
- **Document 8: Infrastructure & DevOps (next)**  
- Document 9: Roadmap & Delivery Plan  

---
