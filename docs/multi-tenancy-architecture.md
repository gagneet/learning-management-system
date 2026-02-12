# Multi-Tenancy Architecture & Center Transfers

## Overview

AetherLearn uses a **center-based multi-tenancy** model where each center operates as an isolated tenant. This document explains the current architecture, its limitations, and the roadmap for handling user transfers between centers.

---

## Current Architecture (Phase 1)

### Single-Center-Per-User Model

```prisma
model User {
  id       String @id
  email    String @unique
  centerId String        // Single center assignment
  center   Center @relation(...)

  // All relationships
  enrollments Enrollment[]
  progress    Progress[]
  invoices    Invoice[]
}
```

**Characteristics:**
- ✅ Simple to implement and reason about
- ✅ Clear data isolation per center
- ✅ Fast queries (no complex joins)
- ✅ Easy RBAC enforcement
- ❌ No support for multi-center users
- ❌ No historical tracking of center changes
- ❌ Data loss risk during transfers

### Data Scoping Rules

All major entities are scoped to a center:

```typescript
// Courses
Course { centerId: string }  // Unique slug per center

// Enrollments
Enrollment { centerId: string }  // Derived from course

// Financial
Invoice { centerId: string }
Payment { centerId: string }

// Academic
ClassCohort { centerId: string }
AttendanceRecord { centerId: string }
```

**SUPER_ADMIN Exception:**
- Can query across all centers
- centerId filter is optional for SUPER_ADMIN
- All other roles strictly scoped to their assigned center

---

## Current Limitations

### 1. User Transfers

**Problem:** If a student/teacher moves to a new center:

❌ **Option A: Update centerId**
```sql
UPDATE "User" SET "centerId" = 'new-center-id' WHERE id = 'user-id';
```
- **Result**: User gains access to new center
- **Loss**: All historical records orphaned
  - Enrollments invisible to old center
  - Payment history fragmented
  - Academic transcripts incomplete
  - Teacher's past courses inaccessible

❌ **Option B: Create new user**
```sql
INSERT INTO "User" (email, centerId) VALUES ('user@email.com', 'new-center-id');
```
- **Result**: Duplicate identity
- **Issues**:
  - Email conflict (must use different email)
  - Login confusion
  - No linkage between accounts

❌ **Option C: Leave in old center**
- **Result**: User cannot access new center's resources
- **Issues**: Manual coordination required

### 2. Cross-Center Reporting

**Limited visibility:**
- Cannot track "total students taught across all centers" for a teacher
- Cannot aggregate "lifetime revenue from a student" across centers
- No consolidated academic transcript

### 3. Multi-Center Users

**Not supported:**
- Teacher who teaches at multiple centers simultaneously
- Student enrolled in courses at different centers
- Parent with children at different centers

### 4. Data Retention & Compliance

**Risks:**
- Academic records may be lost during transfers
- Payment history fragmentation
- Incomplete audit trails
- Compliance issues for institutions requiring complete transcripts

---

## Current Workarounds (Phase 1)

### Manual Transfer Process

See `docs/manual-transfer-guide.md` for detailed steps.

**Summary:**
1. Export user data from old center (JSON format)
2. Create new user in new center
3. Import historical data as "transferred records"
4. Archive old user account
5. Document transfer in audit log

**Tools Provided:**
- `POST /api/admin/transfer-user/export` - Export user's complete data
- `POST /api/admin/transfer-user/import` - Import data to new center
- Transfer audit logging

**Limitations of this approach:**
- Manual process (not self-service)
- Requires SUPER_ADMIN privileges
- No automated validation
- Historical links may break

---

## Future Architecture (Phase 2)

### User-Center Membership Model

**Goal:** Support multi-center users with full historical tracking.

```prisma
model User {
  id    String @id
  email String @unique
  name  String
  // NO centerId field!

  centerMemberships UserCenterMembership[]
}

model UserCenterMembership {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(...)

  centerId  String
  center    Center   @relation(...)

  role      Role     // Can differ per center!

  startDate DateTime @default(now())
  endDate   DateTime? // null = currently active
  status    MembershipStatus

  // Transfer tracking
  transferredFrom String? // Previous center
  transferReason  String?
  approvedBy      String? // Who approved transfer

  @@unique([userId, centerId, startDate])
  @@index([userId, status])
}

enum MembershipStatus {
  ACTIVE           // Currently at this center
  TRANSFERRED_OUT  // Moved to another center
  GRADUATED        // Completed program
  LEFT             // Voluntary departure
  SUSPENDED        // Temporary suspension
}
```

### Benefits

✅ **Complete History**
- Full timeline of centers attended
- Unbroken academic transcript
- Complete payment history across centers

✅ **Multi-Center Support**
- Teacher can teach at multiple centers simultaneously
- Student can have enrollments at different centers
- Parent can access children at different centers

✅ **Flexible Transfers**
- Automated transfer workflows
- Approval process
- Audit trail

✅ **Better Reporting**
- Aggregate metrics across user's lifetime
- Cross-center analytics
- Retention tracking

### Helper Functions (Phase 2)

```typescript
// Get user's current active center(s)
async function getUserActiveCenters(userId: string) {
  return await prisma.userCenterMembership.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: null
    },
    include: { center: true }
  });
}

// Get user's full history
async function getUserCenterHistory(userId: string) {
  return await prisma.userCenterMembership.findMany({
    where: { userId },
    include: { center: true },
    orderBy: { startDate: 'desc' }
  });
}

// Transfer user to new center
async function transferUserToCenter({
  userId,
  fromCenterId,
  toCenterId,
  transferReason,
  approvedBy
}: TransferRequest) {
  // 1. Close current membership
  await prisma.userCenterMembership.updateMany({
    where: {
      userId,
      centerId: fromCenterId,
      status: 'ACTIVE'
    },
    data: {
      status: 'TRANSFERRED_OUT',
      endDate: new Date()
    }
  });

  // 2. Create new membership
  const newMembership = await prisma.userCenterMembership.create({
    data: {
      userId,
      centerId: toCenterId,
      role: newRole, // Could be same or different
      status: 'ACTIVE',
      transferredFrom: fromCenterId,
      transferReason,
      approvedBy
    }
  });

  // 3. Optionally transfer active enrollments
  // 4. Audit log
  // 5. Notifications

  return newMembership;
}
```

### Session Management (Phase 2)

```typescript
// Session would need to track current working center
interface Session {
  user: {
    id: string
    role: string
    activeCenters: string[]  // Array of center IDs
    currentCenterId: string  // Currently selected center
    centerName: string
  }
}

// User can switch between their active centers
async function switchWorkingCenter(userId: string, newCenterId: string) {
  // Validate user has active membership in newCenterId
  // Update session
  // Redirect to dashboard
}
```

### RBAC Updates (Phase 2)

```typescript
// Check if user can access resource from any of their centers
function canAccessResource(session: Session, resource: Resource) {
  // SUPER_ADMIN sees all
  if (session.user.role === 'SUPER_ADMIN') return true;

  // Check if resource is from any of user's active centers
  if (session.user.activeCenters.includes(resource.centerId)) {
    return true;
  }

  // Check if it's user's own historical data from previous center
  if (resource.userId === session.user.id) {
    // User can see their own history even from old centers
    return true;
  }

  return false;
}
```

---

## Migration Path: Phase 1 → Phase 2

### Step 1: Schema Migration (Non-Breaking)

```sql
-- Create new membership table
CREATE TABLE "UserCenterMembership" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "centerId" TEXT NOT NULL,
  role TEXT NOT NULL,
  "startDate" TIMESTAMP NOT NULL DEFAULT NOW(),
  "endDate" TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  "transferredFrom" TEXT,
  "transferReason" TEXT,
  "approvedBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Migrate existing users to memberships
INSERT INTO "UserCenterMembership" ("userId", "centerId", role, status, "startDate")
SELECT id, "centerId", role, 'ACTIVE', "createdAt"
FROM "User";

-- DO NOT drop User.centerId yet! Keep for backwards compatibility
```

### Step 2: Dual-Write Period

Update APIs to write to both:
- `User.centerId` (for backwards compatibility)
- `UserCenterMembership` table (for future)

### Step 3: Read Migration

Gradually update queries to use `UserCenterMembership`:
```typescript
// Old (Phase 1)
const user = await prisma.user.findUnique({ where: { id } });
const centerId = user.centerId;

// New (Phase 2)
const membership = await prisma.userCenterMembership.findFirst({
  where: { userId: id, status: 'ACTIVE' }
});
const centerId = membership.centerId;
```

### Step 4: Remove Dependency

Once all code uses memberships:
```sql
-- Safe to remove after full migration
ALTER TABLE "User" DROP COLUMN "centerId";
```

**Timeline:** 2-3 weeks for full migration with proper testing.

---

## Decision Matrix: When to Migrate?

| Scenario | Recommendation |
|----------|---------------|
| < 5 transfers per year | Stay on Phase 1, use manual process |
| 5-20 transfers per year | Implement Phase 2 in Q2 2026 |
| > 20 transfers per year | Implement Phase 2 immediately |
| Multi-center teachers needed | Implement Phase 2 immediately |
| Regulatory compliance requires complete transcripts | Implement Phase 2 immediately |
| Simple single-center operation | Phase 1 sufficient indefinitely |

---

## API Reference

### Current Transfer APIs (Phase 1)

#### Export User Data
```http
POST /api/admin/transfer-user/export
Authorization: Bearer <token> (SUPER_ADMIN only)

{
  "userId": "user_123",
  "centerId": "center_abc"
}

Response:
{
  "exportId": "export_xyz",
  "user": { /* full user data */ },
  "enrollments": [ /* all enrollments */ ],
  "progress": [ /* all progress records */ ],
  "payments": [ /* payment history */ ],
  "attendances": [ /* attendance records */ ],
  "academicProfile": { /* academic data */ },
  "gamification": { /* badges, achievements */ },
  "exportedAt": "2026-02-12T10:30:00Z"
}
```

#### Import User Data
```http
POST /api/admin/transfer-user/import
Authorization: Bearer <token> (SUPER_ADMIN only)

{
  "targetCenterId": "new_center_123",
  "exportData": { /* from export API */ },
  "options": {
    "preserveIds": false,      // Generate new IDs
    "transferActive": true,    // Transfer active enrollments
    "notifyUser": true         // Email user about transfer
  }
}

Response:
{
  "success": true,
  "newUserId": "user_456",
  "transferredRecords": {
    "enrollments": 3,
    "payments": 12,
    "attendances": 45
  },
  "warnings": [ /* any issues */ ]
}
```

---

## Compliance & Legal Notes

### Data Retention Requirements

Different regions have different requirements:
- **FERPA (US)**: Must retain student records for 5 years after graduation
- **GDPR (EU)**: Right to data portability - users can request full export
- **India**: Educational records retention varies by state

**Current System:** Historical records remain tied to the center where they were created. This is acceptable as long as:
1. Students can access their own historical data via API
2. Transcripts can be generated on request
3. Centers maintain records per legal requirements

### Right to be Forgotten

If a user requests account deletion:
```typescript
// Anonymize user but preserve statistical data
await anonymizeUser(userId); // Replaces PII with "User_<id>"
// Keep financial and academic records with anonymized user
```

**Note:** Complete deletion may violate financial audit requirements.

---

## Performance Considerations

### Phase 1 (Current)
- Fast queries: single centerId filter
- Simple indexes: `@@index([centerId])`
- No joins needed for most queries

### Phase 2 (Future)
- Slightly more complex: join with memberships
- Additional indexes needed
- Caching strategy for active memberships

**Query comparison:**
```typescript
// Phase 1 - Simple
const courses = await prisma.course.findMany({
  where: { centerId: user.centerId }
});

// Phase 2 - With membership
const courses = await prisma.course.findMany({
  where: {
    centerId: {
      in: user.activeCenters // Requires membership lookup first
    }
  }
});
```

**Performance impact:** Negligible for most operations. Add caching for `getUserActiveCenters()`.

---

## Testing Checklist

### Phase 1 Transfer Testing
- [ ] Export user with 0 enrollments
- [ ] Export user with active enrollments
- [ ] Export user with completed courses
- [ ] Export user with payment history
- [ ] Import to new center with same email
- [ ] Import with different email
- [ ] Verify historical data preserved
- [ ] Verify old center can still access archived records
- [ ] Test SUPER_ADMIN can see both old and new records

### Phase 2 Migration Testing
- [ ] Existing users get membership records
- [ ] New users create membership on signup
- [ ] Transfer creates new membership + closes old
- [ ] Multi-center users can switch contexts
- [ ] RBAC works with multi-center access
- [ ] Queries return correct data per active center
- [ ] Historical queries include all centers
- [ ] Performance benchmarks meet SLA

---

## Summary

**Current State (Phase 1):**
- ✅ Simple, fast, reliable for single-center users
- ❌ Manual process needed for transfers
- ❌ No multi-center support

**Future State (Phase 2):**
- ✅ Full transfer automation
- ✅ Complete historical tracking
- ✅ Multi-center user support
- ⚠️  Slightly more complex queries
- ⚠️  Migration effort: 2-3 weeks

**Recommendation:** Stay on Phase 1 until transfer volume or business requirements justify Phase 2 investment.

---

**Document Version:** 1.0
**Last Updated:** 2026-02-12
**Next Review:** Q2 2026 (or when transfer volume > 10/year)
