You are GitHub Copilot acting as a Full-Stack Developer. Using the latest code on the `master` branch of the **learning-management-system** repo, implement the following updates and enhancements:

- **Complete all Phase 1 endpoints and UIs:** Finish coding all API endpoints (cohorts, sessions, attendance, catch-up, tickets, finance) with proper centreId scoping and RBAC checks. Build all remaining pages (student “My Day”, tutor panel, parent invoicing, admin dashboards, asset pages) and connect them to real backend data. Remove all mock data and fix any broken Microsoft Teams join links or placeholders.

- **Session mode toggle:** Allow a tutor to set a session as **Online or Physical** and have that choice persist. Once the tutor marks an existing session’s type, it should save that mode so they don’t have to toggle it every time.

- **Footer and card actions:** Add the common footer to every page (as designed). Make each homepage/dashboard card fully clickable – clicking a card should navigate to its corresponding detail or action page (no static cards).

- **Three theme modes:** Extend the theme toggle to support three modes: **Light**, **Grey (mid-tone)**, and **Dark**. Each mode should apply a consistent color scheme across the app.

Also ensure all other UX requirements from the design document are met:

- Finish **all remaining Phase 1 work**: implement every endpoint and page from the roadmap (about 80% still outstanding). Enforce tenancy and RBAC on both back-end and front-end. 
- Schema/data enhancements: add an `ageTier` (or DOB) to the User model for theming; expand seed data for two centres and all roles; include students with accessibility needs.
- New roles/workflows: support missing roles (Assessor, Reception, etc.) with their pages; extend ticketing for IT/maintenance; implement class transfer/cancellation flows; parent tutor-change requests.
- Gamification & accessibility: expand XP/badge logic (award XP for attendance/homework, implement streak badges); ensure accessibility mode toggles (Dyslexia, Focus, Calm) work via user settings.
- Background jobs & integration: automate catch-up package creation on absences, schedule SLA escalation jobs; integrate Teams/Zoom meetings and transcripts; build a notification system for events.

Provide production-quality code changes that implement these features end-to-end.