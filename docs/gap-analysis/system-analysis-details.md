# System Overview  
The existing LMS is a Next.js/TypeScript app with a Prisma/PostgreSQL backend, designed for multi-tenancy (each “center” is a tenant) and full RBAC (7 roles from SUPER_ADMIN to STUDENT)【19†L72-L81】【1†L8-L17】.  A major recent pivot (Feb 2026) introduced a **Multi-Student Session** model: one tutor can concurrently teach up to ~5 students on different subjects/levels in a single session【1†L8-L17】.  This is implemented via a new **`StudentSessionEnrollment`** model linking each student to a Session with personalized content and progress fields【5†L460-L469】【5†L480-L488】.  Session attendance is tracked per student (join/leave times), and tutors can assign exercises or upload assessments per student. The repo’s architecture uses NextAuth for auth (sessions store user ID, role, center) and Prisma for DB access【19†L66-L75】【19†L89-L98】.  Nginx sits in front as a reverse-proxy (port 3001) with rate-limiting and caching for static assets【30†L78-L87】【30†L110-L119】.  Current features include multi-tenancy, course-module-lesson hierarchy, session planning, and gamification, but some critical tutor-facing tools (e.g. live session dashboard) are incomplete【11†L11-L19】【11†L69-L77】.  

## Architecture & Tech Stack  
The app is monolithic (Node.js/Next.js) but partitioned by domains (auth, courses, sessions, etc.) in the `app/api` router【19†L118-L127】.  Key architecture points:  
- **Multi-Tenancy:** All data is scoped by a `centerId` FK and enforced in middleware【19†L59-L68】【31†L319-L327】. Course slugs and data isolation are per-center.  
- **RBAC & Security:** Roles are enforced via permission checks; NextAuth sessions include role/center; Prisma schema uses enums (e.g. `Role`, `SessionMode`)【19†L72-L79】【19†L99-L107】. Security headers, rate limits, and audit logging are configured (no `centerId` injection, onDelete cascades)【30†L154-L163】【31†L319-L327】.  
- **Real-Time Layer:** To support live collaboration, a WebSocket service (e.g. Socket.IO or native WebSockets) is needed. The Nginx config already sets `Upgrade $http_upgrade` for `/api` routes【30†L77-L86】. We recommend a dedicated Socket.IO/WS handler (e.g. `app/api/socket/route.ts`), where each session has a channel for the tutor and channels for each student. Students emit canvas/command events (e.g. `{ sessionId, studentId, canvasData }`), and the server broadcasts them to the tutor’s view【32†L82-L91】. This supports the “Tutor Control Center” with real-time multi-stream updates.  
- **Collaboration & Microservices:** Some components (e.g. video, chat, whiteboard) may be factored out. For instance, a whiteboard could use Excalidraw embedded in React: students draw on their own layer and emit updates; the tutor’s view overlays all layers【32†L204-L213】. For heavy work (analytics, batch processing), consider microservices or background jobs: the plan is to migrate from node-cron to a queue (BullMQ/Redis) for async tasks【31†L299-L303】. Given the Node foundation, keeping most services in TypeScript ensures consistency, but one could offload compute-heavy tasks (image processing, AI recommendations) to a Rust or .NET service if needed – noting that FFI/cross-language overhead can be significant【28†L242-L249】.  

## Data Schema (Current & Future)  
The Prisma schema defines rich models for multi-student sessions:  

- **StudentSessionEnrollment:** Links a `Session` and a `User (Student)`, with optional `courseId`/`lessonId` for the content the student should work on【5†L460-L469】. It stores per-student JSON fields: `exerciseContent` (assigned exercises) and `assessmentData` (work/grade), plus progress flags (e.g. `completed`, `notes`)【5†L476-L484】. It has indexes on `(sessionId, studentId)` for fast lookup.  
- **SessionAttendance:** Tracks each student’s join/leave times and attendance status (PRESENT/LATE/ABSENT/EXCUSED)【5†L503-L512】. This feeds into automatic “catch-up” generation for absentees.  
- **StudentSessionActivity:** Logs individual exercise attempts during a session: which `exerciseId`, start/completion times, progress percent【24†L1647-L1656】. This supports real-time progress monitoring.  
- **HelpRequest:** Enhanced with `priority` and workflow statuses (PENDING, IN_PROGRESS, etc.) to let students ask for help during a live session【24†L1666-L1675】. Each help request ties to a student, session, and optionally an exercise for context.  
- **TutorNote & ContentAssignment:** For session notes and manual overrides, with visibilities and reason fields【24†L1713-L1722】【24†L1740-L1749】.  
- **AcademicProfile.subjectLevels:** A JSON field tracking each subject’s actual grade vs. current level (e.g. English: Grade 7 actual, working at Grade 4)【32†L110-L118】. Tutors use this to label students (e.g. “Grade 8→Math Grade 5”) and to filter appropriate content.  
- **Other models:** Gamification (XP/Badges), ClassCohort (for group management), CatchUpPackage (auto-generated remedial lessons), etc. The schema is indexed and uses cascade deletes to maintain integrity.  

*Future schema suggestions:*  
- **Detailed Session Log:** Add a `SessionLog` or extended attendance model to archive all session events (start/end, tutor changes, content assignments) for auditing.  
- **Real-Time Analytics:** Include timestamped metrics (e.g. response times, help-request counts) to feed dashboards.  
- **External Integrations:** Tables for video conferencing (if linking to Teams/Zoom APIs) or API tokens.  
- **Expand JSON Fields:** The `StudentSessionEnrollment.assessmentData` can store scanned work metadata (image URLs, scores), and could be linked to a `PhysicalWorkUpload` model if needed.  

## UI/UX & Feature Enhancements  
The UI should center on a **Tutor Control Center** for live sessions. Based on the user’s screenshots and docs, the current session page needs:  

- **Multi-Student Video Grid:** The right pane shows each student’s video or avatar, with individual timers (current session time, total time)【user description】. Behind the scenes, the system should track join/leave to compute these.  
- **Per-Student Panels:** On the left, one column per student (scrollable beyond 5). Each column toggles between **Teach** and **Observe** modes:  
  - *Teach*: The tutor is instructing the student. Show assigned exercises in progress, current lesson, and provide controls (e.g. “assign new exercise”, “mark as complete”).  
  - *Observe*: The student works independently. Show live progress (e.g. percentage of exercise done), help requests, and allow the tutor to “pop in” to assist.  
- **Live Dashboard Elements:** Indicators if a student is active or idle, real-time help request list, and quick actions (like sending a chat or jumping to a student’s canvas)【10†L19-L28】【11†L178-L186】. Implementing WebSocket messaging allows the tutor UI to auto-refresh without full page reloads.  
- **Collapsible Sections & Personalization:** As per README, dashboards support collapsible panes, keyboard navigation, and dark mode【1†L43-L52】【13†L123-L132】. Extend this to the session view – e.g. minimize video grid to focus on one student, or collapse less-used panels.  
- **Responsiveness:** The layout should adapt for tablets (e.g. grid to 2x2 panels) and mobile (vertical scroll or swipe) – already a priority in current design【13†L123-L131】.  
- **Accessibility:** Large touch targets for younger students (AgeTier settings exist), clear color codes for attendance/status, and optional text-to-speech for notes.  

*Code Components:* Many dashboard pages already exist (Tutor Content Library, Student Profile, etc.)【13†L30-L39】【13†L93-L101】. New components/pages needed include:  
- **`/dashboard/tutor/sessions/[id]/control-center`** – Tutor Control Center page (with student panels)  
- **`/dashboard/tutor/sessions/[id]/attendance`** – Enhanced attendance marking (bulk mark Present/Absent/Excused per student, auto-create CatchUpPackage for absentees)【11†L71-L80】【15†L29-L38】  
- **`/dashboard/tutor/attendance` (my-day)** – Tutor “My Day” overview with today’s sessions, pending tasks, active alerts【11†L40-L49】【15†L30-L34】  
- **`/components/AssessmentUpload.tsx`** – For students to upload photos of work (integrate camera/file picker, compress and send to cloud)【32†L144-L153】【32†L150-L158】.  
- **`/dashboard/tutor/assessments/[enrollmentId]`** – Assessor grading view: display image, allow digital ink (canvas overlay) for marking, input fields for score and feedback【32†L159-L168】.  

## Known Gaps and Needed Features  
Recent gap analyses identify several high-priority missing features:  
- **Physical Work Workflow (QR code/Scanning):** Students need to scan worksheets for tutors to mark. Missing: QR code printing, mobile camera upload, annotation workspace. This is critical to avoid purely paper-based processes【11†L13-L21】.  
- **Tutor “My Day” Dashboard:** A one-page summary of today’s schedule, upcoming sessions, pending homework to grade, active help requests, and quick-start actions is not implemented【11†L40-L49】. APIs like `GET /api/academic/tutor/my-day` should aggregate this data.  
- **Bulk Attendance & Catch-Up:** There’s no bulk attendance UI (`/tutor/attendance/:sessionId`) with absent/present toggles. Business logic should auto-generate a catch-up lesson package when marking ABSENT【11†L73-L82】【15†L29-L37】.  
- **Class Cohort Management:** No UI to create/edit classes (`/admin/classes`), add/remove students, or schedule sessions for a whole class. This is needed for group teaching scenarios【11†L120-L129】.  
- **Real-Time Help Handling:** Students can send help requests, but tutors have no interface to respond in-stream (aside from email). We need a live panel/modal to accept and mark requests in progress or resolve them【11†L147-L155】.  
- **Session In-Progress Dashboard:** The existing session page is static. Enhancements include: live student status indicators, an exercise completion tracker, drag-&-drop assignment of exercises mid-session, a session timer with alerts, and quick note taking【11†L178-L186】. This will turn the session view into a dynamic “classroom command center”.  
- **Notifications & Background Jobs:** Many notifications (help requests, upcoming sessions, overdue catch-ups) should be pushed in real time or via cron jobs. The system currently logs such events but lacks a full push-notification or jobs framework. Migrating to BullMQ/Redis workers will enable scheduled reminders (e.g. absent student catch-up notices, SLA escalations)【31†L299-L303】.  

Each gap has been documented in the repo’s CHANGELOG and gap-analysis docs【11†L11-L19】【11†L40-L49】, and should be prioritized per the project roadmap.  

## Performance, Scalability & Technology Considerations  
Given the real-time, multi-stream nature of tutoring sessions, key non-functional requirements are concurrency and reliability. Recommendations:  
- **Horizontal Scalability:** Containerize the app (Docker/Kubernetes) to run multiple Node instances behind a load balancer. This spreads WebSocket connections and API load across processes. Use sticky sessions or a shared WS server (like Socket.IO’s Redis adapter) to sync between nodes.  
- **Asynchronous Processing:** Offload heavy tasks (email, report generation, analytics) to background workers. The repo already plans a move to BullMQ (Redis-based queues) for cron jobs【31†L299-L303】. This improves throughput and fault tolerance.  
- **Database Optimization:** Prisma/PostgreSQL is used; ensure indexes on all FK fields (already done【5†L496-L500】). For frequent session queries, use `include` queries to eagerly load related enrollments/attendance. Use pagination for listing sessions or students. Consider read replicas for reporting.  
- **Language/Framework Choices:** The current stack (Next.js/Node) is appropriate for rapid development and full-stack type-safety. For extreme performance hotspots (e.g. real-time data processing), one could write a microservice in Rust or C# to handle that function. For example, a Rust service could ingest WebSocket messages, process them (e.g. syncing canvases), and broadcast updates back with minimal latency【28†L242-L249】. Similarly, ASP.NET Core (C#) is highly optimized for concurrent I/O. However, added complexity (FFI overhead, separate deployment) should be weighed against benefits. In many cases, Node.js with proper clustering and WebSocket infrastructure (plus a robust database) can handle hundreds of concurrent users. The architecture must also include proper security (OAuth/JWT or NextAuth sessions, HTTPS, audit logs【31†L319-L327】) and encryption for sensitive data.  
- **Reliability & Monitoring:** Deploy health checks (`GET /api/health`) as in the Nginx config【30†L56-L64】. Use PM2 or Kubernetes liveness probes. Add metrics (Grafana/Prometheus) for session counts, response times, and error rates. Ensure automated tests for multi-tenancy and RBAC as planned【31†L355-L360】.  

## Implementation Roadmap & Code Examples  
**Short-term (Phase 1 Enhancements):** Implement missing tutor features first (attendance UI, “My Day” view, help-request panel) as top priority. Use existing React/Next conventions (Server Components for data, Client Components for interactivity). For example, a session fetch might look like:  

```ts
// Example: Fetch session with students' enrollment info
const session = await prisma.session.findUnique({
  where: { id: sessionId },
  include: { 
    enrollments: { 
      include: { student: true, course: true, lesson: true } 
    },
    attendance: true
  },
});
```
*(Above: Prisma query to load a Session and its StudentSessionEnrollments)*【5†L460-L469】【24†L1681-L1690】  

**Medium-term (Phase 2):** Add real-time collaboration (WebSockets). E.g., client code for canvas updates:  

```tsx
// Student-side (canvas change event) 
socket.emit('canvas:update', {
  sessionId, studentId, canvasData: {/* drawing data */}
});
// Server-side (validate and forward to tutor):
io.to(`tutor:${tutorId}`).emit('student:canvas', {
  studentId, canvasData
});
``` 
*(Emit changes and forward only to the tutor)*【32†L82-L91】  

Integrate a whiteboard component in React (e.g. Excalidraw):  

```tsx
<Excalidraw
  initialData={{ elements: [...], appState: {...} }}
  onChange={(elements, appState) => {
    socket.emit('canvas:update', { elements, appState });
  }}
/>
``` 
*(Each student emits their drawing; the tutor’s view would merge all student layers)*【32†L204-L213】.  

**Data model changes:** After adding new models (e.g. StudentSessionEnrollment, HelpRequest fields), run `prisma db:push` (manual migration step)【31†L303-L312】. Add required API routes (RESTful under `/api/academic/` or `/app/api/`) for sessions, attendance, catch-ups, classes, etc., as listed in the roadmap【31†L219-L228】. For instance, a new endpoint `POST /api/academic/attendance/bulk` would accept `{ sessionId, records: [{ studentId, status, notes }] }` and create AttendanceRecords + CatchUpPackages.  

**Long-term (Phase 3+):** Consider modularizing into microservices if scale demands (e.g. a separate Go/Rust service for scheduling or a .NET service for financial ops). Implement comprehensive testing (RBAC, multi-tenancy, performance) as outlined【31†L281-L290】. Implement missing UI pages in the backlog (ticketing, SLA dashboards, class management). Finally, profile and optimize: e.g. upgrade Node.js or DB tuning, based on telemetry.  

**Performance Note:** The team has already committed to using BullMQ for background jobs (escalations, notifications)【31†L299-L303】. Aim for stateless API servers behind Nginx/Cloudflare for scaling, with a separate real-time server (or horizontally scaled Socket.IO instances) for WebSocket connections. Use a CDN (already Cloudflare) for static assets to reduce load. With these changes, the system can robustly support dozens of simultaneous sessions per tutor.  

**Security & Reliability:** Maintain strict RBAC checks in every API handler (as in `lib/rbac.ts`【0†unused】) and ensure all mutations are audit-logged. Utilize Prisma transactions where multi-step operations occur (e.g. marking attendance + catch-up creation). Encrypt all sensitive data in transit.  

**Key Citations:** The repository’s README and docs detail the pivot to multi-student sessions and current architecture【1†L8-L17】【19†L72-L81】. The design docs offer recommendations (e.g. using WebSockets for the Tutor Control Center)【32†L82-L91】. The gap analysis lists missing UI features and API endpoints that must be built【11†L11-L19】【11†L40-L49】. The Prisma schema shows the current models (e.g. `StudentSessionEnrollment`) and indexes【5†L460-L469】【24†L1647-L1656】, illustrating how personalized content and progress are stored per student. These sources should guide implementation of the enhanced student-teacher portal. 

