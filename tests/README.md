# LMS Test Suite

End-to-end tests using [Playwright](https://playwright.dev/) for the AetherLearn LMS application.

## Prerequisites

1. **Install dependencies** (already done if you ran `npm install`):
   ```bash
   npm install
   npx playwright install chromium
   ```

2. **Start the application** (the test runner auto-starts it):
   ```bash
   npm run dev          # development mode
   # OR
   npm start            # production mode (port 3001)
   ```

3. **Seed the database** with demo data (required before running tests):
   ```bash
   npm run db:seed
   ```

## Running Tests

### Playwright E2E Tests
```bash
# Run all tests (headless)
npm test

# Run all tests with Playwright CLI
npx playwright test

# Run with UI (interactive test explorer)
npx playwright test --ui

# Run in headed browser (visible browser window)
npx playwright test --headed

# Run a specific test file
npx playwright test tests/dashboard.spec.ts

# Run tests matching a pattern
npx playwright test --grep "Tutor"

# Show HTML test report after run
npx playwright show-report
```

### Jest API Tests
```bash
# Run Jest API tests
npx jest tests/api/

# Run a specific API test
npx jest tests/api/classes.test.ts

# Run with coverage
npx jest --coverage tests/api/
```

## Test Files

| File | Coverage |
|------|----------|
| `home.spec.ts` | Home page, login portals, branding |
| `login.spec.ts` | Authentication flow, validation, error handling |
| `dashboard.spec.ts` | Role-based dashboards (Admin, Student, Tutor, Supervisor) |
| `theme-and-navigation.spec.ts` | Theme toggle (Light/Gray/Dark), navigation across roles |
| `tutor-pages.spec.ts` | Tutor feature pages: My Day, Planner, History, Content Library, Assessments, Resource sub-pages (assessments/media/templates), Catch-up Packages |
| `student-features.spec.ts` | Student features: Goals, Homework, Awards, Gamification, Help |
| `api-health.spec.ts` | API health endpoint, auth requirements, public pages |
| `navigation-redirects.spec.ts` | All role navigation links resolve without 404 |
| `live-session-tracking.spec.ts` | Live session control center and real-time student tracking |
| `catchup-pages.spec.ts` | Student catch-up packages, tutor catch-up management |
| `admin-classes.spec.ts` | Admin class cohort management, RBAC access control |
| `v1-api.spec.ts` | Phase 1 v1 API: help requests, goals, awards, homework, tutor notes, assessments, student-traits, tickets |
| `video-sessions.spec.ts` | Multi-student video conferencing: Daily.co integration, RBAC, navigation, API auth, session details Start Video button (fixed to show for all ONLINE sessions) |
| `supervisor-pages.spec.ts` | Supervisor dashboard, financial page, finance admin access, redirect behaviours, action cards |

### API Tests (Jest - `tests/api/`)

| File | Coverage |
|------|----------|
| `api/classes.test.ts` | Classes API CRUD operations |
| `api/presence.test.ts` | Session presence tracking (join/leave events) |

## Demo Credentials

All tests use these seeded demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@lms.com | admin123 |
| Center Admin | centeradmin@lms.com | admin123 |
| Supervisor | supervisor@lms.com | admin123 |
| Finance Admin | finance@lms.com | admin123 |
| Teacher 1 | teacher@lms.com | teacher123 |
| Teacher 2 | teacher2@lms.com | teacher123 |
| Parent 1 | parent1@lms.com | admin123 |
| Student 1 | student@lms.com | student123 |
| Student 2 | student2@lms.com | student123 |

## Configuration

Test configuration is in `playwright.config.ts`:
- **Base URL**: `http://localhost:3000` (dev) or `http://localhost:3001` (prod)
- **Browser**: Chromium (default)
- **Retries**: 0 (dev), 2 (CI)
- **Parallelism**: Full parallel in dev
- **Auto-start**: Dev server starts automatically if not running

## CI/CD

In CI environments, set `CI=true` to enable:
- 2 retries on failure
- Single worker (sequential)
- Strict mode (no `test.only`)

```bash
CI=true npx playwright test
```

## Adding New Tests

1. Create a new `.spec.ts` file in the `tests/` directory
2. Use the `login()` helper pattern from existing test files
3. Ensure your test accounts exist in the seeded data
4. Run `npm run db:seed` if you add new test scenarios requiring data

## Troubleshooting

**Tests fail with "Cannot find element"**
- Run `npm run db:seed` to ensure demo data exists
- Check the app is running: `pm2 status` or `curl http://localhost:3001/api/health`

**Port conflicts**
- Dev server uses port 3000; production uses 3001
- Update `baseURL` in `playwright.config.ts` if needed

**Authentication failures**
- Verify passwords in demo accounts haven't changed
- Re-run `npm run db:seed` to reset credentials
