# Tutor Session Dashboard - UX/UI Design Document

**Version:** 1.0
**Date:** February 13, 2026
**Status:** Design Phase
**Target:** Phase 1 Individualized Tutoring Platform

---

## Executive Summary

The Tutor Session Dashboard is the central command center for tutors conducting live sessions with multiple students working on different courses and difficulty levels simultaneously. This design integrates real-time monitoring, help request management, content assignment, and progress tracking into a cohesive interface.

---

## Design Principles

1. **Real-time First** - Prioritize live information during active sessions
2. **Contextual Actions** - Show relevant actions based on student status
3. **Minimal Clicks** - Common actions within 1-2 clicks
4. **Visual Hierarchy** - Critical information prominent, details accessible
5. **Responsive Layout** - Adapt to various screen sizes and orientations
6. **Dark Mode Support** - Full theme compatibility

---

## User Personas

### Primary User: Tutor (TEACHER role)
- Manages 1-15 students simultaneously
- Needs to monitor individual progress across different content
- Responds to help requests while managing overall session flow
- Takes notes, assigns exercises, marks attendance
- Switches between individual and group views

---

## Information Architecture

```
Tutor Session Dashboard
│
├── Header Bar (Fixed)
│   ├── Session Title & Timer
│   ├── Session Status Control (Start/Pause/End)
│   ├── Active Students Count
│   └── Actions Menu (Notes, Attendance, Settings)
│
├── Help Request Panel (Collapsible, Priority Badge)
│   ├── Urgent Queue
│   ├── High Priority Queue
│   ├── Medium/Low Priority Queue
│   └── Resolved History
│
├── Student Grid View (Main Area)
│   └── Student Cards (2-4 columns responsive)
│       ├── Student Info & Avatar
│       ├── Current Activity Status
│       ├── Progress Indicator
│       ├── Exercise Context
│       ├── Quick Actions
│       └── Recent Notes Badge
│
├── Detail Sidebar (Slide-in)
│   ├── Student Profile Tab
│   │   ├── Academic Level
│   │   ├── Current Assessment
│   │   ├── Goals & Achievements
│   │   └── Strengths/Weaknesses
│   ├── Session Activity Tab
│   │   ├── Exercise History
│   │   ├── Time Spent
│   │   ├── Scores & Progress
│   │   └── Help Requests
│   ├── Content Assignment Tab
│   │   ├── Current Content
│   │   ├── Assign New Exercise
│   │   ├── Assign Homework
│   │   └── Next Content Suggestion
│   └── Notes Tab
│       ├── Add New Note
│       ├── Session Notes
│       └── Historical Notes
│
└── Bottom Action Bar (Fixed)
    ├── End Session Button
    ├── Mark Attendance
    ├── Generate Session Report
    └── Broadcast Message
```

---

## Key Interface Sections

### 1. Header Bar (Fixed Top)

**Purpose:** Quick access to session-level controls and status

**Components:**
```
┌─────────────────────────────────────────────────────────────┐
│ [←] Programming Class - Year 5  [LIVE ● 45:23]    [6/8 🟢] │
│                                                              │
│ [Start Session] [Pause] [End Session]  [✎ Notes] [👤 Att] │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- Back button to sessions list
- Session title (editable)
- Live status indicator with elapsed time
- Active students count (present/total)
- Session control buttons (disabled when not LIVE)
- Quick access to notes and attendance
- Theme toggle

**States:**
- SCHEDULED: Gray, "Start Session" enabled
- LIVE: Green indicator, pause/end enabled
- COMPLETED: Badge shows completed, controls disabled

---

### 2. Help Request Panel (Collapsible)

**Purpose:** Real-time help request queue management

**Default State:** Collapsed with badge showing count by priority

**Expanded View:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🆘 Help Requests                              [Minimize] [×] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ⚠️ URGENT (1)                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Sarah Johnson                              [2 min ago]  │ │
│ │ Exercise: Fractions Division                            │ │
│ │ "I don't understand question 3..."                      │ │
│ │ [Acknowledge] [View Exercise] [Chat]                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ 🔴 HIGH (2)                                                 │
│ [Collapsed - Click to expand]                               │
│                                                              │
│ 🟡 MEDIUM (3)                                               │
│ [Collapsed - Click to expand]                               │
│                                                              │
│ ✅ Resolved Today (5)                                       │
│ [Show history]                                               │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Color-coded priority (Red=Urgent, Orange=High, Yellow=Medium, Gray=Low)
- Auto-expand on new urgent request with sound notification
- Time elapsed since request
- Exercise context displayed
- Quick actions: Acknowledge, View Exercise, Chat
- Status transitions: PENDING → ACKNOWLEDGED → IN_PROGRESS → RESOLVED
- Filter by status
- Historical view for learning patterns

**Priority Badge (Collapsed):**
```
🆘 Help Requests [1 URGENT] [2 HIGH] [3 MEDIUM]
```

---

### 3. Student Grid View (Main Area)

**Purpose:** At-a-glance monitoring of all students in session

**Layout:** Responsive grid (2-4 columns based on screen size)

**Student Card:**
```
┌─────────────────────────────────────────────────────┐
│ [👤 Avatar]  Sarah Johnson                    [⋮]  │
│              Grade 4 → Working at Grade 5           │
├─────────────────────────────────────────────────────┤
│ Status: 🟢 WORKING                                  │
│ Exercise: Fractions Division (Q 3/10)               │
│ Time: 12:45 mins                                    │
│                                                      │
│ Progress: ████████░░ 80%                            │
│                                                      │
│ [📝 Add Note] [📋 Assign] [💬 Help: 1]             │
│                                                      │
│ Last Note: "Great progress on long division" (2d)   │
└─────────────────────────────────────────────────────┘
```

**Status Indicators:**
- 🟢 WORKING - Actively working on exercise
- 🔴 WAITING_HELP - Help request active
- ✅ COMPLETED - Finished current exercise
- ⏸️ IDLE - Not actively working (>5 min)
- ⭕ NOT_STARTED - Haven't begun

**Card Elements:**
- Avatar with status indicator overlay
- Student name (clickable to expand details)
- Academic level vs. current working level
- Current activity status
- Exercise context with progress
- Time spent on current activity
- Progress bar
- Quick action buttons
- Recent note preview with timestamp
- Badge indicators (help requests, new notes, achievements)

**Sorting Options:**
- By priority (help requests first)
- By status (idle/blocked first)
- By name (alphabetical)
- By progress (struggling first)
- By time in session

---

### 4. Detail Sidebar (Slide-in from Right)

**Purpose:** Deep-dive into individual student data and actions

**Trigger:** Click student name or card

**Width:** 40% of screen (min 400px, max 600px)

#### Tab 1: Student Profile

```
┌─────────────────────────────────────────────────────┐
│ [Profile] [Activity] [Content] [Notes]        [×]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 👤 Sarah Johnson                                    │
│ Grade 4 Student | Reading Age: 10.5 years           │
│                                                      │
│ 📊 Current Assessment                               │
│ ├─ Mathematics: Grade 5 level                       │
│ ├─ English: Grade 4 level                           │
│ └─ Last assessed: 5 days ago                        │
│                                                      │
│ 🎯 Active Goals (2)                                 │
│ ├─ Master multiplication tables (75% complete)      │
│ └─ Read 5 chapter books (3/5)                       │
│                                                      │
│ ⭐ Strengths                                         │
│ • Quick mental math                                 │
│ • Problem-solving approach                          │
│                                                      │
│ ⚠️ Areas for Support                                │
│ • Fractions conceptual understanding                │
│ • Word problem interpretation                       │
│                                                      │
│ 💎 Recent Achievements                              │
│ • Perfect score on Times Tables (2 days ago)        │
│ • 7-day login streak                                │
└─────────────────────────────────────────────────────┘
```

#### Tab 2: Session Activity

```
┌─────────────────────────────────────────────────────┐
│ [Profile] [Activity] [Content] [Notes]        [×]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📈 Today's Session Activity                         │
│                                                      │
│ Total Time: 45 minutes                              │
│ Exercises Completed: 3/5                            │
│ Average Score: 85%                                  │
│                                                      │
│ ┌─ Exercise Timeline ───────────────────────────┐  │
│ │                                                │  │
│ │ 14:00 - Started "Fractions Division"          │  │
│ │        ├─ Q1-5: 100% ✅                       │  │
│ │        ├─ Q6: Help requested (resolved)       │  │
│ │        └─ Q7-10: In progress...               │  │
│ │                                                │  │
│ │ 14:25 - Completed "Decimal Addition"          │  │
│ │        Score: 90% (9/10) ⭐                    │  │
│ │                                                │  │
│ │ 14:35 - Started "Word Problems"                │  │
│ │        Score: 70% (7/10) ⚠️                    │  │
│ │                                                │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ 🆘 Help Requests Today                              │
│ ├─ 14:22 - "Confused about Q6" (Resolved, 3 min)   │
│ └─ 14:40 - "Question 3 unclear" (In Progress)      │
│                                                      │
│ [View Full History]                                  │
└─────────────────────────────────────────────────────┘
```

#### Tab 3: Content Assignment

```
┌─────────────────────────────────────────────────────┐
│ [Profile] [Activity] [Content] [Notes]        [×]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📚 Current Content                                  │
│ Course: Mathematics Grade 5                         │
│ Unit: Fractions & Decimals                          │
│ Lesson: Division with Fractions                     │
│                                                      │
│ ✨ Suggested Next Content                           │
│ Based on performance and assessment level:          │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🎯 Recommended                                  │ │
│ │ Multiplying Fractions                           │ │
│ │ Difficulty: Medium | Est. 20 min                │ │
│ │ Reason: Strong foundation, ready to advance     │ │
│ │ [Assign This]                                   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ 📝 Assign New Content                               │
│                                                      │
│ [Type to search exercises...]                       │
│                                                      │
│ Quick Filters:                                       │
│ [Same Unit] [Next Difficulty] [Review]              │
│                                                      │
│ Recent Exercises:                                    │
│ • Decimal Addition (Completed, 90%)                 │
│ • Fraction Word Problems (Completed, 70%)           │
│ • Times Tables Practice (Completed, 100%)           │
│                                                      │
│ 📋 Assign as Homework                               │
│ [Select Exercises...] [Set Due Date]                │
│                                                      │
│ Override Auto-Sequencing:                            │
│ ☐ Manual content selection (explain why)            │
└─────────────────────────────────────────────────────┘
```

#### Tab 4: Notes

```
┌─────────────────────────────────────────────────────┐
│ [Profile] [Activity] [Content] [Notes]        [×]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ✍️ Add New Note                                     │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Write note here...]                            │ │
│ │                                                 │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Visibility: ○ Internal Only  ● Share with Parents   │
│                                                      │
│ [Save Note] [Cancel]                                 │
│                                                      │
│ ─────────────────────────────────────────────────── │
│                                                      │
│ 📝 Today's Session Notes (3)                        │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 14:25 - By You                           [Edit] │ │
│ │ Great progress on fractions! Sarah showed       │ │
│ │ excellent understanding of the concept.         │ │
│ │ 👁️ Shared with parents                          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 14:12 - By You                           [Edit] │ │
│ │ Sarah struggled with word problems. Need more   │ │
│ │ practice with translating text to equations.    │ │
│ │ 🔒 Internal only                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ [Load Previous Sessions...]                          │
└─────────────────────────────────────────────────────┘
```

---

### 5. Bottom Action Bar (Fixed)

**Purpose:** Session-level bulk actions

```
┌─────────────────────────────────────────────────────────────┐
│ [📊 Session Report] [👤 Mark Attendance] [📢 Broadcast]    │
│                                              [End Session ►] │
└─────────────────────────────────────────────────────────────┘
```

**Actions:**
- **Session Report:** Generate summary with attendance, exercises completed, issues noted
- **Mark Attendance:** Bulk attendance marking interface
- **Broadcast Message:** Send message to all students in session
- **End Session:** Finalizes session, prompts for final notes

---

## Component Specifications

### Color System

**Status Colors:**
```
Active/Working:     Green (#10b981)
Help Needed:        Red (#ef4444)
Completed:          Blue (#3b82f6)
Idle:               Gray (#6b7280)
Urgent:             Red (#dc2626)
High Priority:      Orange (#f97316)
Medium Priority:    Yellow (#eab308)
Low Priority:       Gray (#9ca3af)
```

**Theme Colors:**
```
Light Mode:
- Background:       #f9fafb
- Card Background:  #ffffff
- Text Primary:     #111827
- Text Secondary:   #6b7280
- Border:           #e5e7eb

Dark Mode:
- Background:       #111827
- Card Background:  #1f2937
- Text Primary:     #f9fafb
- Text Secondary:   #9ca3af
- Border:           #374151
```

### Typography

```
Headings:
- Session Title:    text-2xl font-bold
- Section Title:    text-xl font-semibold
- Card Title:       text-lg font-medium
- Body Text:        text-base
- Supporting Text:  text-sm text-gray-600

Monospace:
- Timer:            font-mono text-lg
- Metrics:          font-mono text-sm
```

### Spacing & Layout

```
Grid Columns:
- Desktop (>1280px):  4 columns
- Laptop (>1024px):   3 columns
- Tablet (>768px):    2 columns
- Mobile (<768px):    1 column

Card Spacing:
- Padding:            p-4 (16px)
- Gap between cards:  gap-4 (16px)
- Border radius:      rounded-lg (8px)

Sidebar:
- Width:              40vw (min 400px, max 600px)
- Padding:            p-6 (24px)
- Slide animation:    300ms ease-in-out
```

### Interactive Elements

**Button Styles:**
```
Primary:    bg-blue-600 hover:bg-blue-700 text-white
Secondary:  bg-gray-200 hover:bg-gray-300 text-gray-800
Danger:     bg-red-600 hover:bg-red-700 text-white
Success:    bg-green-600 hover:bg-green-700 text-white
Ghost:      hover:bg-gray-100 text-gray-700
```

**Transitions:**
```
All interactive elements:  transition-colors duration-200
Sidebar slide:            transition-transform duration-300
Card hover:               hover:shadow-lg transition-shadow
Help request pulse:       animate-pulse (for urgent)
```

---

## Interaction Patterns

### Help Request Flow

1. **Student submits help request** (via student interface)
2. **Notification appears** in tutor dashboard
   - If URGENT: Auto-expand panel + sound notification
   - If HIGH/MEDIUM: Badge count updates
3. **Tutor acknowledges request**
   - Status changes to ACKNOWLEDGED
   - Student sees "Help is on the way" message
4. **Tutor views context**
   - Opens student detail sidebar
   - Views exercise and student's answers
   - Sees previous help requests for patterns
5. **Tutor responds**
   - Can add response text
   - Can chat in real-time
   - Marks as IN_PROGRESS
6. **Issue resolved**
   - Tutor marks as RESOLVED
   - Optional: Add note about resolution
   - Request moves to resolved history

### Content Assignment Flow

1. **Tutor opens student detail sidebar**
2. **Reviews suggested next content**
   - Auto-sequencing algorithm suggests based on:
     - Current assessment level
     - Recent performance
     - Exercise completion patterns
     - Time spent and struggle indicators
3. **Tutor selects content**
   - Can accept suggestion (1 click)
   - Can search/filter exercises
   - Can review exercise details
4. **Assignment created**
   - Immediately appears in student's interface
   - Student receives notification
   - Activity tracked in session timeline

### Note Taking Flow

1. **Quick note from card**
   - Click "Add Note" button on student card
   - Modal appears with note input
   - Select visibility (internal/parent-visible)
   - Save (autosaves draft every 30s)
2. **Detailed note from sidebar**
   - Open student sidebar → Notes tab
   - See all historical notes with context
   - Add new note with rich text
   - Tag note with categories
   - Link to specific exercises/sessions

---

## Responsive Behavior

### Desktop (>1280px)
- Help panel: Left sidebar (300px)
- Student grid: 4 columns
- Detail sidebar: Right slide-in (600px)
- All features fully visible

### Laptop (1024px - 1280px)
- Help panel: Collapsible, badge only
- Student grid: 3 columns
- Detail sidebar: Right slide-in (500px)
- Reduce card padding slightly

### Tablet (768px - 1024px)
- Help panel: Bottom drawer
- Student grid: 2 columns
- Detail sidebar: Full screen modal
- Stack action buttons vertically

### Mobile (<768px)
- Help panel: Bottom sheet with swipe
- Student grid: 1 column with infinite scroll
- Detail sidebar: Full screen with back button
- Floating action button for main actions

---

## Accessibility Features

### Keyboard Navigation
- Tab through all interactive elements
- Arrow keys for grid navigation
- Enter/Space for button activation
- Escape to close modals/sidebars
- Keyboard shortcuts:
  - `h` - Focus help requests
  - `n` - Add note to selected student
  - `a` - Mark attendance
  - `s` - Search exercises
  - `Cmd/Ctrl + Enter` - Save note

### Screen Reader Support
- ARIA labels on all interactive elements
- Live regions for help request notifications
- Status announcements on state changes
- Semantic HTML structure
- Alt text for all images/avatars

### Visual Accessibility
- WCAG 2.1 AA contrast ratios
- Focus indicators (2px blue outline)
- No color-only information
- Scalable font sizes (rem units)
- Support for reduced motion preference

---

## Performance Considerations

### Real-time Updates
- WebSocket connection for live data
- Optimistic UI updates
- Debounced note autosave (30s intervals)
- Lazy load historical data
- Virtual scrolling for large student lists

### Data Loading Strategy
- Initial load: Essential session data only
- Progressive: Load student details on demand
- Background: Fetch next content suggestions
- Cached: Historical notes and session data
- Paginated: Exercise search results

### Bundle Size
- Code split by route
- Lazy load detail sidebar
- Dynamic imports for charts/visualizations
- Optimize images (WebP, lazy loading)
- Tree-shake unused utilities

---

## Error States & Edge Cases

### No Students in Session
```
┌─────────────────────────────────────────────────────┐
│            No students enrolled yet                  │
│                                                      │
│        [Invite Students] [Add Enrollments]           │
└─────────────────────────────────────────────────────┘
```

### Network Disconnection
```
⚠️ Connection lost. Reconnecting... [Retry]
[Offline mode enabled - changes will sync when reconnected]
```

### All Students Idle
```
💤 All students appear inactive
[Send Reminder] [Check Connection]
```

### Help Request Overflow (>10 pending)
```
🚨 Multiple students need help!
[View Queue] [Broadcast Message: "One moment please..."]
```

---

## Success Metrics

### Quantitative
- Help request response time < 2 minutes
- Note creation time < 30 seconds
- Exercise assignment < 1 minute
- Session setup < 5 minutes
- Page load time < 2 seconds
- Real-time update latency < 500ms

### Qualitative
- Tutor can monitor all students simultaneously
- Context switching feels seamless
- No critical information hidden or missed
- Actions feel intuitive and quick
- Interface reduces cognitive load

---

## Technical Implementation Notes

### Key Technologies
- Next.js 16 React Server Components for initial load
- Client components for interactive elements
- WebSocket (Socket.io) for real-time updates
- React Query for data fetching/caching
- Zustand for local state management
- Framer Motion for animations
- Tailwind CSS for styling

### API Integration Points
```
Real-time endpoints:
- GET /api/v1/sessions/[id]/live-status
- WS  /api/v1/sessions/[id]/realtime
- POST /api/v1/help-requests/[id]/acknowledge
- POST /api/v1/help-requests/[id]/resolve

Content management:
- GET /api/v1/students/[id]/next-content
- POST /api/v1/homework (assign exercises)
- POST /api/v1/tutor-notes (add notes)
- GET /api/v1/exercises/[id] (exercise details)

Session management:
- PATCH /api/v1/sessions/[id]/status
- POST /api/v1/sessions/[id]/attendance
- GET /api/v1/sessions/[id]/report
```

---

## Future Enhancements (Post-MVP)

1. **Analytics Dashboard**
   - Session effectiveness metrics
   - Student engagement trends
   - Help request patterns
   - Content difficulty analysis

2. **AI Assistance**
   - Suggest interventions for struggling students
   - Auto-categorize help requests
   - Predict content recommendations
   - Generate session summaries

3. **Collaboration Features**
   - Co-teaching mode (multiple tutors)
   - Peer help assignments
   - Breakout room management

4. **Advanced Content Management**
   - Drag-and-drop curriculum builder
   - Custom exercise creation
   - Resource library integration
   - Interactive whiteboard

---

## Appendix: Wireframe References

### A. Full Dashboard Layout (Desktop)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [←] Programming - Year 5    [LIVE ● 45:23]    [6/8 🟢]        [@] [⚙] [☾] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 🆘 Help [1 URGENT] [2 HIGH]                                    [Minimize] │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ Sarah J. | Fractions Division | "Don't understand Q3..." [View] [Chat]│ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│ │👤 Sarah │ │👤 John  │ │👤 Emma  │ │👤 Mike  │                          │
│ │Grade 4  │ │Grade 5  │ │Grade 3  │ │Grade 4  │                          │
│ │🟢Working│ │🔴Help!  │ │✅Done   │ │⏸️Idle   │                          │
│ │Fractions│ │Decimals │ │Times Tb │ │Word Prb │                          │
│ │████80%  │ │███░30%  │ │█████100%│ │██░░20%  │                          │
│ │[Note][➕]│ │[Note][➕]│ │[Note][➕]│ │[Note][➕]│                          │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                          │
│                                                                              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│ │[More...│ │[More...│ │[More...│ │[More...│                          │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                          │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ [📊 Report] [👤 Attendance] [📢 Broadcast]              [End Session ►]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Document Status:** Ready for Review
**Next Steps:**
1. Review with stakeholders
2. Create high-fidelity mockups in Figma
3. Develop component library
4. Implement MVP features
5. User testing with tutors

