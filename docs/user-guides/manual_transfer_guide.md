# Manual User Transfer Guide

## Overview

This guide explains how to manually transfer a user (student, teacher, or parent) from one center to another while preserving their historical data.

**Use this process when:**
- A student moves to a different learning center
- A teacher is reassigned to another location
- A parent's children switch centers

**Prerequisites:**
- You must have SUPER_ADMIN role
- Both source and target centers must exist
- You must have verified the user's consent for transfer

---

## Transfer Process Overview

```
┌─────────────┐
│   Step 1    │  Export user data from old center
│   Export    │  → Full JSON export with all relationships
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Step 2    │  Review exported data
│   Review    │  → Verify completeness, check for issues
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Step 3    │  Create new user in target center
│   Import    │  → Imports historical records with new IDs
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Step 4    │  Archive old user account
│  Archive    │  → Soft delete with transfer notes
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Step 5    │  Notify stakeholders
│   Notify    │  → Email user, admins, teachers
└─────────────┘
```

---

## Step 1: Export User Data

### 1.1 Identify the User

First, find the user's ID and current center:

```bash
# Via Prisma Studio
npx prisma studio
# Navigate to User table, search by email

# Or via API
curl -X GET "https://lms.gagneet.com/api/users?email=student@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Record:**
- User ID: `user_clxxx123`
- User Email: `student@example.com`
- Current Center ID: `center_old123`
- Current Center Name: `Main Campus`

### 1.2 Call Export API

```bash
curl -X POST "https://lms.gagneet.com/api/admin/transfer-user/export" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_clxxx123",
    "centerId": "center_old123"
  }' \
  -o user_export_$(date +%Y%m%d_%H%M%S).json
```

**This exports:**
- User profile (name, email, role, dates)
- All course enrollments with progress
- Academic profile (reading age, numeracy age, etc.)
- Gamification data (XP, level, badges, achievements)
- Payment history and invoices
- Attendance records
- Class memberships
- Session attendance
- Parent-child relationships (if applicable)

### 1.3 Verify Export

Check the exported JSON file:

```bash
# View summary
cat user_export_20260212_103045.json | jq '{
  user: .user.name,
  enrollments: (.enrollments | length),
  payments: (.payments | length),
  attendances: (.attendances | length)
}'

# Expected output:
{
  "user": "John Doe",
  "enrollments": 3,
  "payments": 12,
  "attendances": 45
}
```

**Checklist:**
- [ ] User data present and correct
- [ ] All enrollments listed
- [ ] Payment history complete
- [ ] Academic profile included
- [ ] Gamification data present

---

## Step 2: Review Exported Data

### 2.1 Check for Issues

**Common issues to look for:**

#### Active Enrollments
```json
"enrollments": [
  {
    "id": "enroll_123",
    "courseId": "course_456",
    "progress": 45.5,
    "completedAt": null,  // ← ACTIVE enrollment
    "status": "ACTIVE"
  }
]
```

**Decision:**
- ✅ Transfer if equivalent course exists at new center
- ⚠️ Mark as withdrawn if no equivalent
- ⚠️ Complete enrollment before transfer if near completion

#### Outstanding Payments
```json
"invoices": [
  {
    "invoiceNumber": "INV-2026-0123",
    "status": "OVERDUE",  // ← Outstanding balance
    "balance": 250.00
  }
]
```

**Action Required:**
- Collect payment before transfer, OR
- Transfer debt to new center, OR
- Write off balance (requires approval)

#### Parent-Child Relationships
```json
"children": [
  {
    "id": "child_789",
    "name": "Jane Doe",
    "centerId": "center_old123"  // ← Child at same center
  }
]
```

**Considerations:**
- Transfer parent AND children together?
- Or separate parent/child centers?
- Update login credentials?

### 2.2 Prepare Transfer Notes

Create a transfer summary document:

```
TRANSFER REQUEST SUMMARY
========================
Date: 2026-02-12
Requested By: [Admin Name]
Approved By: [Supervisor Name]

USER DETAILS:
- Name: John Doe
- Email: student@example.com
- Role: STUDENT
- Current Center: Main Campus (center_old123)
- Target Center: Online Campus (center_new456)

TRANSFER REASON:
Family relocation to new city

ACTIVE ENROLLMENTS:
1. Introduction to Programming (45% complete) → Transfer to equivalent
2. Mathematics Level 2 (80% complete) → Complete before transfer
3. English Composition (10% complete) → Withdraw

FINANCIAL STATUS:
- Outstanding balance: $0.00
- Payment history: 12 payments, all completed

SPECIAL NOTES:
- Student has younger sibling (Jane Doe) - transfer together
- Request preserve achievement badges
- New center to assign equivalent courses

APPROVALS:
[ ] Finance Admin verified no outstanding balance
[ ] Academic supervisor approved transfer
[ ] New center has capacity
[ ] User notified and consented
```

---

## Step 3: Import to New Center

### 3.1 Verify Target Center

```bash
# Check center exists and has capacity
curl -X GET "https://lms.gagneet.com/api/centers/center_new456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3.2 Call Import API

```bash
curl -X POST "https://lms.gagneet.com/api/admin/transfer-user/import" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetCenterId": "center_new456",
    "exportData": <PASTE_EXPORTED_JSON_HERE>,
    "options": {
      "preserveIds": false,
      "transferActive": true,
      "transferPayments": true,
      "notifyUser": true,
      "transferNotes": "Family relocation - transferred from Main Campus"
    }
  }'
```

**Import Options Explained:**

| Option | Values | Description |
|--------|--------|-------------|
| `preserveIds` | true/false | If false, generates new IDs (recommended) |
| `transferActive` | true/false | Transfer active enrollments to equivalent courses |
| `transferPayments` | true/false | Include payment history |
| `notifyUser` | true/false | Send email notification to user |
| `transferNotes` | string | Reason for transfer (appears in audit log) |

### 3.3 Verify Import Success

The API returns:

```json
{
  "success": true,
  "newUserId": "user_newabc789",
  "transferredRecords": {
    "enrollments": 2,        // Only active ones transferred
    "completedCourses": 1,   // Historical completion records
    "payments": 12,          // Full payment history
    "attendances": 45,       // Historical attendance
    "academicProfile": 1,
    "gamification": 1,
    "badges": 8
  },
  "warnings": [
    "Course 'Mathematics Level 2' has no equivalent at target center - enrollment marked as withdrawn",
    "Achievement 'Perfect Attendance - Main Campus' is center-specific and was not transferred"
  ],
  "newCredentials": {
    "email": "student@example.com",
    "tempPassword": "TempPass123!",  // User must change on first login
    "loginUrl": "https://lms.gagneet.com/login"
  }
}
```

**Checklist:**
- [ ] New user ID received
- [ ] All expected records transferred
- [ ] Review warnings and address
- [ ] Credentials ready for user

---

## Step 4: Archive Old User Account

### 4.1 Soft Delete Old User

**DO NOT hard delete!** We need to preserve the audit trail.

```bash
curl -X PATCH "https://lms.gagneet.com/api/users/user_clxxx123" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "TRANSFERRED",
    "bio": "⚠️ TRANSFERRED to Online Campus on 2026-02-12. New user ID: user_newabc789",
    "email": "archived_student@example.com"  // Change email to free up for new user
  }'
```

**Why change email?**
- Emails must be unique in the system
- Old email needs to work for new user at new center
- Prefix with `archived_` to indicate status

### 4.2 Add Transfer Audit Log

```bash
curl -X POST "https://lms.gagneet.com/api/audit" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "super_admin_id",
    "userName": "Admin Name",
    "userRole": "SUPER_ADMIN",
    "action": "TRANSFER",
    "resourceType": "User",
    "resourceId": "user_clxxx123",
    "beforeState": {
      "centerId": "center_old123",
      "status": "ACTIVE"
    },
    "afterState": {
      "centerId": "center_new456",
      "newUserId": "user_newabc789",
      "status": "TRANSFERRED"
    },
    "centreId": "center_old123",
    "metadata": {
      "transferReason": "Family relocation",
      "transferDate": "2026-02-12",
      "approvedBy": "Supervisor Name",
      "recordsTransferred": {
        "enrollments": 2,
        "payments": 12
      }
    }
  }'
```

---

## Step 5: Notify Stakeholders

### 5.1 Notify User

**Email Template:**

```
Subject: Your Account Transfer to Online Campus

Dear John Doe,

Your learning account has been successfully transferred to Online Campus as requested.

TRANSFER DETAILS:
- New Center: Online Campus
- Transfer Date: February 12, 2026
- Transferred Records:
  ✓ 2 active course enrollments
  ✓ Complete payment history
  ✓ Academic progress and achievements
  ✓ All badges and XP

YOUR NEW LOGIN CREDENTIALS:
- URL: https://lms.gagneet.com/login
- Email: student@example.com (unchanged)
- Temporary Password: TempPass123!

IMPORTANT: You must change your password on first login.

WHAT TO EXPECT:
- All your progress has been preserved
- Your badges and achievements have been transferred
- Payment history is available for reference
- Some center-specific achievements may not be visible

If you have any questions, please contact:
- Online Campus Admin: admin@onlinecampus.com
- Phone: (555) 123-4567

Welcome to Online Campus!

Best regards,
AetherLearn Administration
```

### 5.2 Notify Old Center Admin

```
Subject: Student Transfer Notification - John Doe

Dear Main Campus Administrator,

This is to inform you that the following student has been transferred
to Online Campus:

STUDENT: John Doe (student@example.com)
TRANSFER DATE: February 12, 2026
NEW CENTER: Online Campus
REASON: Family relocation

FINAL STATUS AT MAIN CAMPUS:
- Total Enrollments: 3 courses
- Completed Courses: 1
- Outstanding Balance: $0.00
- Attendance Rate: 95%

RECORDS RETENTION:
All historical records remain available in your center's database
for reporting and audit purposes. The student's account has been
marked as "TRANSFERRED" and archived.

If you need to access this student's historical data, you can:
1. View in Prisma Studio (filter by archived users)
2. Use API: GET /api/users/user_clxxx123?includeArchived=true
3. Request a data export from system administrator

Thank you,
AetherLearn Administration
```

### 5.3 Notify New Center Admin

```
Subject: New Student Transfer - John Doe

Dear Online Campus Administrator,

A new student has been transferred to your center:

STUDENT: John Doe
EMAIL: student@example.com
NEW USER ID: user_newabc789
TRANSFER DATE: February 12, 2026
PREVIOUS CENTER: Main Campus

TRANSFERRED RECORDS:
✓ 2 active enrollments (mapped to your equivalent courses)
✓ Complete academic profile
✓ Payment history (12 payments, $0 balance)
✓ 45 days of attendance history
✓ 8 achievement badges

ACTION REQUIRED:
1. Assign student to appropriate class cohorts
2. Introduce student to assigned teachers
3. Verify course mappings are correct:
   - "Introduction to Programming" → Your Course ID: course_xyz
   - "English Composition" → Your Course ID: course_abc

STUDENT COMMUNICATION:
The student has been notified of the transfer and provided with
new login credentials. They will need to reset their password
on first login.

SPECIAL NOTES:
- Student has younger sibling who may also transfer
- Request to preserve achievement badges (completed)
- No outstanding financial obligations

If you have any questions or need assistance with onboarding,
please contact the system administrator.

Welcome the new student!
AetherLearn Administration
```

---

## Rollback Procedure

If the transfer needs to be reversed:

### 1. Export from New Center
```bash
curl -X POST "https://lms.gagneet.com/api/admin/transfer-user/export" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"userId": "user_newabc789", "centerId": "center_new456"}'
```

### 2. Restore Old User Account
```bash
curl -X PATCH "https://lms.gagneet.com/api/users/user_clxxx123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "ACTIVE",
    "email": "student@example.com"  // Restore original email
  }'
```

### 3. Archive New User
```bash
curl -X PATCH "https://lms.gagneet.com/api/users/user_newabc789" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status": "ARCHIVED", "bio": "Transfer reversed"}'
```

### 4. Notify User
Send email explaining the rollback and credentials restoration.

---

## Troubleshooting

### Issue: Email Already Exists Error

**Problem:** Cannot import because email already exists at new center.

**Solution:**
```bash
# Option A: Archive the conflicting user first
# Option B: Use a temporary email for the imported user
# Option C: Merge the accounts if they're the same person
```

### Issue: Missing Course Equivalents

**Problem:** Active enrollment has no equivalent course at new center.

**Solutions:**
1. Create equivalent course at new center first
2. Mark enrollment as "withdrawn" during import
3. Allow student to choose new course after transfer

### Issue: Payment History Discrepancy

**Problem:** Total paid amount doesn't match exported data.

**Action:**
1. Do NOT proceed with import
2. Investigate financial records at old center
3. Resolve discrepancy before transfer
4. Generate corrected export

### Issue: Parent-Child Transfer Mismatch

**Problem:** Parent transferred but children remain at old center.

**Solution:**
- Transfer children using same process
- Update parent's `children` relationships
- Ensure all family members at same center (or document exception)

---

## Audit & Compliance

### Required Documentation

For each transfer, maintain:

1. **Transfer Request Form**
   - User consent
   - Reason for transfer
   - Approvals (finance, academic, supervisor)

2. **Export Data Archive**
   - Full JSON export
   - Stored securely for 7 years (FERPA compliance)

3. **Import Result Log**
   - Success/failure status
   - Warnings and resolutions
   - Transferred record counts

4. **Notification Confirmations**
   - Email delivery receipts
   - User acknowledgment

### Retention Policy

| Record Type | Retention Period | Location |
|-------------|-----------------|----------|
| Export JSON | 7 years | Secure backup storage |
| Audit logs | 7 years | Database + backup |
| Transfer forms | 7 years | Document management system |
| Email notifications | 2 years | Email archive |

---

## Checklist: Complete Transfer

Use this checklist for every transfer:

### Pre-Transfer
- [ ] User consent obtained and documented
- [ ] Finance admin verified $0 balance
- [ ] Academic supervisor approved
- [ ] Target center has capacity
- [ ] Equivalent courses identified
- [ ] Transfer request form completed

### Export Phase
- [ ] User data exported successfully
- [ ] Export file backed up securely
- [ ] All relationships verified in export
- [ ] No missing data (enrollments, payments, etc.)

### Review Phase
- [ ] Active enrollments reviewed
- [ ] Payment status confirmed
- [ ] Parent-child relationships checked
- [ ] Transfer notes prepared

### Import Phase
- [ ] Target center verified
- [ ] Import API called successfully
- [ ] New user ID received
- [ ] All warnings reviewed and addressed
- [ ] Course mappings verified

### Cleanup Phase
- [ ] Old user account archived
- [ ] Email address freed for new user
- [ ] Transfer audit log created
- [ ] Historical records preserved

### Notification Phase
- [ ] User notified with new credentials
- [ ] Old center admin notified
- [ ] New center admin notified
- [ ] Parent notified (if applicable)

### Post-Transfer
- [ ] User successfully logged in with new credentials
- [ ] User confirmed all data is accessible
- [ ] New center admin assigned classes
- [ ] No outstanding issues

### Documentation
- [ ] Transfer request form filed
- [ ] Export JSON archived
- [ ] Audit trail complete
- [ ] Email confirmations saved

---

## FAQ

**Q: Can we transfer a user who has an outstanding balance?**
A: Technically yes, but not recommended. Collect payment first or get approval for debt transfer/write-off.

**Q: What happens to the user's badges?**
A: Non-center-specific badges transfer. Center-specific achievements (e.g., "Main Campus Star Student") are not transferred.

**Q: Can a teacher be at two centers simultaneously?**
A: Not in Phase 1. You'd need to create two separate accounts. Phase 2 will support multi-center users.

**Q: What if the student wants to come back to the old center?**
A: Treat it as a new transfer from new center back to old center. Historical records from first stay are preserved.

**Q: How long does the transfer process take?**
A: Manual process: 30-60 minutes. Includes review, export, import, and notifications.

**Q: Do parents need to be transferred when children transfer?**
A: Recommended if parent needs to access new center's portal. Otherwise, parent can remain at old center but won't see child's data.

---

## Support

For transfer assistance:
- **Email:** support@aetherlearn.com
- **Documentation:** https://lms.gagneet.com/docs
- **API Reference:** https://lms.gagneet.com/docs/api.md

**Escalation:** For complex transfers or issues, contact the SUPER_ADMIN team.

---

**Document Version:** 1.0
**Last Updated:** 2026-02-12
**Maintained By:** AetherLearn Technical Team
