# Video Sessions Workflow Guide

## Overview

AetherLearn LMS includes built-in video conferencing powered by **Daily.co WebRTC**. Tutors can conduct live sessions with multiple students simultaneously, with each student working on different courses and exercises at their own academic level.

> **Note**: Video conferencing requires a Daily.co account with `DAILY_API_KEY` and `DAILY_DOMAIN` configured in the environment variables. Without these, sessions will fall back to external meeting links.

---

## Tutor Workflow

### Step 1: View Your Sessions

1. Log in with your tutor account (`teacher@lms.com` / `teacher123` in demo)
2. From the dashboard, click **"All Sessions"** or **"Video Sessions"** action card
3. Or navigate to: `/dashboard/tutor/sessions`

You will see:
- **Upcoming Sessions** – Scheduled sessions (including today's)
- **Past Sessions** – Completed sessions (last 20)

### Step 2: Start a Video Session

**From the Sessions List:**
- For **ONLINE** sessions: Click the **"📹 Start Video"** button
- For **PHYSICAL** sessions: Click **"▶ Go Live"** to open the session dashboard

**From the Session Details page** (`/dashboard/tutor/sessions/[id]`):
- For ONLINE sessions: Click **"📹 Start Video Session"** (purple button)
- Also available: **"🎯 Session Dashboard"** for the live control panel

> **Key fix**: The "Start Video Session" button now appears for **all ONLINE/HYBRID sessions**, not only sessions that already have a room ID. The video page auto-creates the Daily.co room on first visit.

### Step 3: The Video Session Page

URL: `/dashboard/tutor/sessions/[id]/video`

**Two-Panel Layout:**

```
┌────────────────────┬──────────────────────────────┐
│                    │  Student 1: Alice            │
│  VIDEO GRID        │  Course: Programming         │
│                    │  Status: WORKING             │
│  [Tutor]  [Alice]  │  Session: 00:23:14           │
│  [Bob]    [Carol]  │  [TEACH] [OBSERVE]           │
│                    ├──────────────────────────────┤
│                    │  Student 2: Bob              │
│                    │  Course: Mathematics         │
│                    │  Status: WAITING_HELP        │
│                    │  Session: 00:18:45           │
└────────────────────┴──────────────────────────────┘
```

**Left Panel – Video Grid:**
- Live video streams for all participants
- Camera/microphone controls
- Screen share (when enabled)

**Right Panel – Student Columns:**
- Real-time session timer per student
- Cumulative session time
- Current course and lesson
- Status indicator (Working / Needs Help / Completed / Idle)
- **TEACH / OBSERVE** mode toggle per student
- Quick actions: Assign content, Send message

### Step 4: Manage Students During Session

**Teach Mode** (default): Active teaching – student's content is highlighted
**Observe Mode**: Passive monitoring – student works independently

**Status Indicators:**
| Status | Meaning |
|--------|---------|
| WORKING | Student is actively engaged |
| WAITING_HELP | Student has raised a help request |
| COMPLETED | Student finished their assigned work |
| IDLE | No activity detected |

### Step 5: End Session

1. Click the **Leave** button in the video controls
2. The session status auto-updates
3. Recordings (if enabled) are processed by Daily.co and available in Past Sessions

---

## Student Workflow

### Step 1: Find Your Session

1. Log in with your student account
2. From the dashboard, click **"My Sessions"** card
3. Or navigate to: `/dashboard/student/sessions`

You will see:
- **Upcoming Sessions** – Your scheduled sessions
- **Past Sessions** – Completed sessions with recordings

### Step 2: Join a Video Session

**For ONLINE sessions:**
- Click **"📹 Join Video"** (before session starts)
- Click **"📹 Join Live Video"** (when session is live – red indicator)

> The join button links to the same video page as the tutor. Students are enrolled and the page validates access.

**For PHYSICAL sessions:**
- Location is shown next to the session

### Step 3: In the Session

- Your camera and microphone activate automatically (requires browser permission)
- Work on your assigned course/lesson
- Request help using the **"Request Help"** button in `/dashboard/student/help`
- Your tutor can see your progress and switch between Teach/Observe modes

### Step 4: View Recordings (Past Sessions)

- Click **"📼 Watch Recording"** next to any completed session
- Recordings are available once Daily.co finishes processing (usually within minutes)

---

## Parent Workflow

Parents can monitor their children's sessions from the parent dashboard:

1. Navigate to `/dashboard/parent`
2. View **"Upcoming Sessions"** card to see children's scheduled sessions
3. Session details show: tutor name, time, course, mode (Online/Physical)
4. Click **"Upcoming Sessions"** from action cards

> Parents cannot join video sessions directly (privacy/security). They can contact the tutor via the **"Messages"** action card.

---

## Admin / Supervisor Workflow

Supervisors and Center Admins can monitor all sessions:

1. Navigate to `/dashboard/supervisor`
2. Use **"Analytics"** card to see session attendance trends
3. Use **"Tutor Performance"** card to review session metrics

---

## Session Modes Explained

| Mode | Description | Video Button |
|------|-------------|--------------|
| ONLINE | Virtual session via Daily.co | ✅ "📹 Start Video" |
| HYBRID | Mix of online and in-person | ✅ "📹 Start Video" |
| PHYSICAL | In-person at a location | ❌ "▶ Go Live" (Dashboard) |

---

## Navigation Reference

### Tutor Navigation
| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/dashboard` | Action cards grid |
| All Sessions | `/dashboard/tutor/sessions` | Sessions list with video buttons |
| Session Details | `/dashboard/tutor/sessions/[id]` | Details + Start Video button |
| Video Session | `/dashboard/tutor/sessions/[id]/video` | Live video conferencing |
| Session Dashboard | `/dashboard/tutor/sessions/[id]/live` | Live control panel |
| Session Planner | `/dashboard/tutor/planner` | Plan and create sessions |
| My Day | `/dashboard/tutor/my-day` | Today's schedule |

### Student Navigation
| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/dashboard/student` | Overview with upcoming sessions |
| My Sessions | `/dashboard/student/sessions` | Sessions list with join buttons |
| Request Help | `/dashboard/student/help` | Submit help request during session |

---

## Troubleshooting

### "Video room not yet created"
This message appears when `DAILY_API_KEY` is not configured. Contact your administrator to set up Daily.co credentials.

### Session button not showing
- Ensure the session mode is set to **ONLINE** or **HYBRID** (not Physical)
- Physical sessions use the "Go Live" dashboard instead of video

### Camera/microphone not working
- Allow browser permissions for camera and microphone
- Check your device settings
- Try a different browser (Chromium recommended)

### Student can't join
- Verify the student is enrolled in the session (`studentEnrollments`)
- Check the session status is SCHEDULED or LIVE (not CANCELLED/COMPLETED)

---

## Environment Setup (for Administrators)

Add to `.env.production`:

```bash
DAILY_API_KEY=your_daily_co_api_key
DAILY_DOMAIN=your-domain.daily.co
```

See `/docs/VIDEO_QUICKSTART.md` for full Daily.co setup instructions.
