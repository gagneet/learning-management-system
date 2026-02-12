## 1. **Phase 1 Completion**  
All remaining Phase 1 APIs (cohorts, sessions, attendance, catch-up, tickets, finance) and UIs must be implemented.  According to the roadmap, ~80% of endpoints and ~85% of pages are still outstanding.  We need to **finish coding all 44 endpoints** with multi-tenancy (`centreId` scoping) and RBAC checks (per roles defined in PRD【35†L10-L18】). This includes: 
- Class/Cohort CRUD (add/remove students) and session scheduling (with meeting links).  
- Attendance UI for marking PRESENT/ABSENT (and auto-creating CatchUpPackage on ABSENT).  
- Ticketing CRUD (including comments/attachments) plus SLA calculation/escalation job.  
- Finance endpoints: fee plans, invoice + lines, payments, refund requests and approval.  
- Governance: audit log queries and approvals queue (ensuring every write logs to AuditEvent【35†L23-L27】).  

All UI pages listed in the design doc (student “My Day”, tutor panel, parent/invoice view, admin dashboards, asset pages) must be built and wired to real data. We should also enforce **centre scoping and RBAC on the frontend** (route guards) as per Phase 1 PRD【35†L10-L18】. Essentially, treat the CoPilot design as a blueprint: fill in each API and page that’s only stubbed or missing.

## 2. **Schema & Data Enhancements**  
The Prisma schema needs minor extensions:  
- **Add `ageTier` (or DOB)** to the `User` model for theming (set at signup, overrideable).  
- Ensure `User.accessibilitySettings` can store mode toggles (currently a JSON field【30†L58-L61】). We might store flags like `{ dyslexiaMode: true, focusMode: false, ... }`.  
- Index `ageTier` if querying by theme.  
- Possibly add `Notification` and `NotificationPreference` models for the event-driven alerts mentioned.  
Seed data should be expanded to cover: 2 centres, users of every role (SUPER_ADMIN, CentreAdmin, Supervisor, Finance, Teacher, Assessor, Reception, Parent, Student), courses, classes, sessions (some in past to test attendance), tickets (incl. asset/infra requests), invoices/payments (with at least one refund request pending). Include a few students with specialNeeds/accessibility flags to test those modes.

## 3. **New Roles & Workflows**  
The CoPilot plan mentions many roles but omitted some from the earlier analysis (e.g. *Assessors, Receptionists, IT/Infrastructure*). We should: 
- **Add roles** as needed (`ASSESSOR`, `RECEPTION`) and update RBAC logic accordingly.  
- **Assessors:** Provide an interface to review/exam submissions (likely leveraging the scanning/annotation workflow). Also a page to approve or reject new student enrolments (the CoPilot plan didn’t mention new enrolments approval).  
- **Administrative tickets:** Extend the ticket system for staff requests (laptop repairs, supplies, facilities). Create ticket categories or a parallel “Request” endpoint.  
- **Class transfers and cancellations:** Build UI/API to handle cancelled classes. If a tutor is unavailable, allow CentreAdmin to reassign students to other tutors, carrying over progress. This requires a transfer workflow: copy `ClassMembership` with history and notify the new tutor/student.  
- **Parent requests:** The plan hints at tutor-change requests. Implement a simple form + status tracking for such requests, likely using the existing ApprovalRequest or ticket model.  
- **Asset tracking:** For “stockists, infrastructure”, integrate or plan integration with an asset management tool. At minimum, create an `Asset` model (e.g. laptops, furniture) and maintenance tickets. This was partially specified earlier and should tie into the ticketing module (e.g. an “IT” ticket type).

## 4. **Gamification & UX Refinements**  
The outlined gamification stack aligns with our existing gamification code but needs enhancement:  
- **XP & Badges:** Our `lib/config/gamification.ts` currently defines XP for lessons/quizzes【26†L6-L14】. We should extend this to cover *attending sessions, on-time homework, participation points*, etc., and add any new badge criteria. The XP-award API【27†L15-L23】 already enforces that only teacher/supervisor/admin can award XP, which fits the plan’s “tutor awards XP” model. We must code the triggers (e.g. when attendance is marked present, or assignment submitted) to call that API.  
- **Age-Adaptive Theming:** Implement a theme context (per quick-start) that switches CSS variables based on user’s `ageTier`. This affects layout density, fonts, navigation style etc. For example, set larger buttons and friendly mascots for Tier 1 users. Use CSS custom properties or Tailwind theming to support the three “skins”.  
- **Accessibility Modes:** The document’s modes can all be derived from `User.accessibilitySettings`【30†L58-L61】. E.g. if `dyslexiaMode=true`, load the Lexend font (via `next/font`), increase letter-spacing and use a #FDF6E3 background (as recommended). Create global CSS classes or React hooks for Focus/Calm modes (hide non-essentials, add Pomodoro timer, disable animations, etc). Add a UI in Settings to toggle these (which updates the DB).  
- **UI/UX polish:** Build all recommended dashboard components: e.g. a “My Day” panel with today’s tasks, progress visualisations (mastery bars or Duolingo-style path), and badges carousel. For tutors, build a “Mission Control” view (calendar of sessions + marking queue with colour-coded statuses). Ensure all new components have keyboard focus styles and proper ARIA labels.  

## 5. **Background Jobs & Integration**  
- **Catch-Up & Escalation Workers:** Implement the attendance->catch-up logic. When an attendance is marked ABSENT, trigger (or schedule a job) to create the CatchUpPackage if not already present. Add a cron to fetch any overdue catch-up tasks (send reminders or escalate). Similarly, for tickets: add a scheduled job (e.g. Node script on cron) that marks overdue tickets as ESCALATED and logs an audit event.  
- **Live Session Integration:** The plan references Teams/Zoom. We should integrate Microsoft Graph for creating online meetings (if not done) and fetching transcripts post-session. Ensure the UI shows join-links and transcripts. (This was in earlier requirements but not explicit in the summary, so verify if needed).  
- **Event-driven Notifications:** Extend our event system. For example, when a tutor assignment or class membership changes, publish a `TutorAssigned` event so the Notification system can inform the tutor/student/parent. Build a `Notification` model and API endpoint to fetch user notifications. Add real-time or polling-based UI (e.g. in header) for new alerts.  

## 6. **Testing & QA**  
- **Playwright Tests:** Write comprehensive end-to-end tests for the new UX. Tests should cover all user roles and modes: logging in as a Tier 1 student should show the simple UI and “Start Learning” button; as a Supervisor should see the approvals queue and KPI cards; as a finance user should see the invoice payment flows. Include tests for accessibility: e.g. toggle Dyslexia mode and verify the Lexend font is applied. Test gamification flows: awarding XP, progressing levels, earning badges. Ensure tenancy: a user from Centre A should not see Centre B’s data.  
- **Unit/Integration Tests:** For new APIs, write unit tests validating RBAC and data filtering. For example, test that a `POST /api/attendance` filters by `centreId` even if user tries to mark someone from another centre (should fail【35†L10-L15】).  
- **Load/Regression Tests:** Given the complexity, consider smoke tests on the staging URL (lms.gagneet.com) after deployment of these enhancements.  

## 7. **Remaining Enhancements**  
Beyond Phase 1, the CoPilot plan hints at broader vision. Some enhancements to start planning now:  
- **Payroll & Financials:** The plan stops at invoicing/refunds. If tutors need pay runs or commissions, design that (not in Phase 1 but flagged as Phase 2 work).  
- **Stock/Inventory Integration:** The asset tracking should eventually sync with an external asset system (like Snipe-IT) or have its own detailed checkout flows.  
- **Multi-region Deployment & Observability:** For production readiness, set up infrastructure-as-code (Cloud/Azure templates), monitoring (Prometheus/Grafana for uptime), and automatic backups. Ensure all new features have proper logging and security reviews.  
- **Localization:** The UX doc assumes English. We should plan for internationalisation (labels, calendar formats) if needed. The code already has `languagePreference` field for this.  
- **Compliance:** Age-gating (COPPA) for under-13 accounts should be enforced on sign-up. Ensure data protection for scanned work (maybe purge old scans per policy).  

**Conclusion:** The Copilot plan covers many innovative features, but we must **integrate them carefully with our core requirements** (RBAC, tenancy, data integrity). The remaining work is largely execution: finish Phase 1 APIs/UIs, extend the schema (ageTier, notifications), implement the detailed UX/gamification elements, and build robust tests. Throughout, we must never lose sight of the core principles in the PRD (e.g. scoping by `centreId`【35†L10-L15】 and strict RBAC). By doing so, we will fully realise the vision of an age-adaptive, accessible, and engaging LMS.