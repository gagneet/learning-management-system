# LMS Extended Operations Blueprint
## Multi-Role Governance, Requests, Finance & Centre Operations

This document expands the LMS into a full Centre Operations Platform covering:

- Administrative & Supervisory roles
- Assessors & academic governance
- Finance & reimbursement flows
- Support staff (reception, operations)
- Parents & guardians
- Infrastructure/service vendors
- Request & ticketing system
- Tutor reassignment & redistribution logic
- Cancellation & contingency workflows

---

# 1. Extended Role Architecture

## Core Academic Roles
- Global Admin
- Centre Admin
- Supervisor (Academic Lead)
- Tutor
- Assessor
- Student
- Parent / Guardian

## Operational Roles
- Receptionist / Front Desk
- Support Centre Staff
- Finance Officer
- Payroll Officer
- IT / Infrastructure Manager
- Stock & Procurement Officer

## External Roles
- Vendor / Stockist
- IT Contractor
- Maintenance Provider

---

# 2. Unified Request & Ticketing System

A central Request Management Engine must exist.

## Request Categories

Academic:
- Change tutor
- Reschedule class
- Catch-up session
- Assessment review

Operational:
- Laptop repair
- Printer issue
- Broken furniture
- Equipment malfunction

Administrative:
- Enrolment change
- Withdrawal
- Refund request
- Payment extension

HR / Tutor:
- Leave request
- Capacity change
- Student reassignment

---

# 3. Tutor-Student Matching Engine

Matching Criteria:
- Subject expertise
- Level certification
- Max student quota
- Performance rating
- Behaviour compatibility
- Accommodation expertise

If no ideal tutor:
- Rank closest match
- Require supervisor approval
- Auto-generate student summary pack

---

# 4. Student Transfer Workflow

1. Trigger (parent/supervisor/system)
2. Supervisor review
3. Matching engine recommendation
4. Generate Transfer Summary Pack:
   - Academic profile
   - Last 5 lessons
   - Skill heatmap
   - Behaviour notes
   - Pending assignments
5. Tutor acknowledgment
6. Audit log entry

---

# 5. Cancellation & Redistribution Logic

If tutor unavailable:
1. Convert to remote if possible
2. Assign substitute
3. Redistribute students
4. Generate catch-up packages

Redistribution requires:
- Level compatibility check
- Capacity check
- Parent notification
- Student history summary to new tutor

---

# 6. Finance Architecture

Revenue:
- Tuition
- Enrolment fees
- Materials fees
- Penalties

Expenses:
- Tutor payroll
- Rent
- Utilities
- Supplies
- Infrastructure

Tutor Payroll Models:
- Per session
- Hourly
- Salary
- Bonus-based

Refund/Reimbursement require:
- Ticket reference
- Finance approval
- Audit trail

---

# 7. Parent Portal

Parents can:
- View attendance
- Request tutor change
- Submit complaints
- View invoices
- Track payments

---

# 8. Asset Management

Assets:
- Laptops
- Printers
- Projectors
- Furniture
- Network equipment

Track:
- Serial number
- Location
- Maintenance history
- Condition

---

# 9. Governance & Audit

Log:
- Initiator
- Approver
- Timestamp
- Old vs new state

Critical areas:
- Tutor changes
- Refunds
- Payroll edits
- Assessment overrides
- Attendance edits

---

# 10. KPI Dashboard

Supervisor:
- Tutor utilisation
- Attendance rate
- Revenue per class
- Catch-up backlog

Global:
- Centre profitability
- Tutor performance index
- Growth trends

---

This extended design transforms the LMS into a complete Centre Management & Academic Governance Platform.
