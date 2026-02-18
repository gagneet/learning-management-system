Can you help me implement these LMS/School Student Study application enhancements:

Based on our code analysis and research, I have converted the work into clear phases. Each phase lists specific tasks (APIs, pages, tests, etc.) that should be implemented to close gaps and improve the LMS. Citations reference the existing documentation and schema to ground each recommendation.

## Phase 1: Core Backend & UI Features  
The first phase addresses missing core functionality identified in the gap analysis【11†L11-L19】 and the project’s roadmap【34†L331-L335】. Key tasks include creating academic APIs and corresponding UI pages:

- **Academic APIs:** Implement REST endpoints under `/api/academic/` for managing **Classes, Sessions, Attendance, and CatchUps** (e.g. `GET/POST /classes`, `GET/POST /sessions`, `POST /attendance/bulk`)【34†L331-L335】【11†L71-L80】. These should follow the data models (e.g. `ClassCohort`, `Session`, `AttendanceRecord`, `CatchUpPackage`) already defined in the Prisma schema.  
- **Tutor “My Day”:** Build `GET /api/academic/tutor/my-day` plus a new tutor dashboard page (`/dashboard/tutor/my-day`) summarizing today’s schedule, pending tasks, and stats【11†L40-L49】【34†L331-L335】. Include features like session countdowns and alerts for help requests.  
- **Attendance UI:** Create a bulk attendance page (`/dashboard/tutor/attendance/:sessionId`) to mark each student as PRESENT/LATE/ABSENT/EXCUSED. When marking **ABSENT**, automatically generate a CatchUpPackage (per business logic)【11†L71-L80】【34†L331-L335】. Provide per-student notes and status colors.  
- **Class Management UI:** Add pages under `/admin/classes` to **create/edit class cohorts** and add/remove students【11†L120-L129】. Support bulk scheduling for classes and show class-level attendance trends.  
- **Catch-Up Workflows:** Implement student and tutor catch-up views (`/dashboard/student/catchups` and `/dashboard/tutor/catchups`) and APIs `GET/PATCH /api/academic/catchups`. Ensure absent students see a list of catch-up exercises to complete.  
- **Help Requests:** Finish help-request endpoints (`/api/help-requests`) so students can signal for help, and enable tutors to view/respond. Add a tutor-side help-request panel or modal to handle incoming requests【11†L147-L155】.  
- **Session Pages:** Enhance the basic session-detail page by adding in-session controls – e.g., live “Join” buttons, session timers, and quick status indicators. Allow tutors to assign exercises on the fly. This aligns with the “classroom command center” concept【11†L178-L186】.  

Phase 1 should also include creating initial **seed data** scripts so the database is populated with example centers, users, courses, etc. (the project uses `npm run db:seed` for demo data【36†L284-L287】). This ensures testers can log in with demo credentials and validate the new pages. 

## Phase 2: Real-Time & Interactive Features  
Phase 2 focuses on live collaboration and multimedia enhancements. Based on the advanced tutoring design, implement WebSocket-driven interactions and collaborative tools【32†L82-L91】:

- **WebSocket Infrastructure:** Add a Socket.IO or WebSocket server route (e.g. `/api/socket`) to enable real-time updates. Connect tutor and student clients in sessions: students emit events (e.g. canvas drawings or status updates) and the server relays relevant data to the tutor’s view【32†L82-L91】.  
- **Collaborative Whiteboard:** Integrate a drawing canvas (e.g. [Excalidraw](https://excalidraw.com) or Fabric.js). Each student works on a personal canvas layer; their changes emit `socket.emit('canvas:update', {...})`【32†L82-L91】. The tutor’s page overlays all student layers in real time. Implement save/load of canvas state (e.g. in `StudentSessionEnrollment.exerciseContent`).  
- **Multi-Stream Video Grid:** On the session-control page (`/dashboard/tutor/sessions/[id]/control-center`), display each connected student’s video or avatar in a grid. Show individual timers (current session time, total interaction time). This mirrors the “Tutor Control Center” design【10†L12-L21】. Make inactive streams greyed out.  
- **Live Progress Tracking:** As students complete exercises, update progress bars on the tutor’s dashboard. Broadcast exercise-completion events via the WebSocket.  
- **Optional Integrations:** Consider integrating third-party live tools if needed (e.g. Microsoft Teams). For now, focus on the custom real-time flow. 

These changes require minimal technology shifts (continuing with Next.js/TypeScript on backend). Ensure Node/Socket.IO setup can scale (hint: use Nginx proxy_upgrade headers as configured【30†L77-L86】). 

## Phase 3: Performance, Testing, and Polish  
The final phase covers robustness, performance tuning, and quality assurance:

- **Testing:**  
  - Write **Playwright UI tests** to cover critical user flows (tutor login, session control center, attendance marking, student dashboard). Automate end-to-end scenarios reflecting the new features.  
  - Write **pytest (or Jest)** tests for API endpoints: verify permissions, data validation, and correct behavior (e.g. marking ABSENT creates a catch-up). Aim for high coverage on `attendance`, `sessions`, and `catchups` APIs.  These align with our success criteria of ≥60–80% test coverage【34†L389-L396】.  
  - Include multi-tenancy and RBAC tests (ensure queries are scoped by `centerId`) per [34].  

- **Seed Data:** Ensure the database seed (`prisma/seed.ts` or similar) includes new models/fields. The CLAUDE doc shows sample seed uses (`npm run db:seed` populates centers, users, courses, modules)【36†L284-L287】. Add seed entries for any new tables (e.g. `ClassCohort`). Use these in tests for realistic scenarios.  

- **Performance & Reliability:**  
  - Review the database schema and add any missing indexes for new fields (e.g. index on `sessionId` in attendance, on `studentId` in catch-ups).  
  - Enable server-side caching or pagination if needed (the Nginx config already does static caching【30†L110-L119】).  
  - Consider background jobs (BullMQ) for non-critical tasks (email notifications, catch-up reminders) as planned in Phase 2 goals【31†L299-L303】.  
  - Profile key endpoints; optimize queries (e.g. use `include` in Prisma to minimize round-trips)【36†L290-L298】.  

- **Documentation & Build:** Update any affected documentation (README, API specs). Ensure the CI pipeline runs the new tests and that linting passes (see CLAUDE notes on coding standards). 

Each phase’s tasks should be implemented sequentially. Begin with the core APIs and pages (Phase 1) before adding interactivity and tests. Use the existing codebase structure (Next.js App Router, TypeScript, Prisma) and seed script from CLAUDE【36†L284-L287】. This structured, phase-wise plan aligns the implementation with the prior analysis and makes the application robust and fully tested.

