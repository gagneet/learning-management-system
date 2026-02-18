# Multi-Student Video Session - UI Layout

## Page Layout Visualization

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Math Class - Feb 18, 2026 14:30                                               │
│  Tutor: Ms. Johnson  •  14:30  •  4 Students  •  🟢 LIVE                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────┬────────────────────────────────────────────────┐
│                                │                                                │
│   LEFT PANEL: VIDEO SCREENS    │   RIGHT PANEL: STUDENT INFO COLUMNS            │
│                                │                                                │
│  ┌──────────────────────────┐  │  ┌──────────┬──────────┬──────────┬──────────┐│
│  │                          │  │  │ Alice C. │  Bob W.  │ Carol M. │ David L. ││
│  │   DAILY.CO VIDEO GRID    │  │  │  Grade 8 │  Grade 7 │  Grade 6 │  Grade 8 ││
│  │                          │  │  │  Math G5 │  Eng G6  │  Math G4 │  Sci G7  ││
│  │   ┌────────┐ ┌────────┐  │  │  │          │          │          │          ││
│  │   │ Tutor  │ │ Alice  │  │  │  │ Session: │ Session: │ Session: │ Session: ││
│  │   │  🎥    │ │  🎥    │  │  │  │  00:45   │  00:38   │  00:42   │  00:35   ││
│  │   └────────┘ └────────┘  │  │  │  Total:  │  Total:  │  Total:  │  Total:  ││
│  │   ┌────────┐ ┌────────┐  │  │  │  02:15   │  01:48   │  01:52   │  00:35   ││
│  │   │  Bob   │ │ Carol  │  │  │  │          │          │          │          ││
│  │   │  🎥    │ │  🎥    │  │  │  │ ● WORKING│ ● IDLE   │🔴NEED HLP│● WORKING ││
│  │   └────────┘ └────────┘  │  │  │          │          │          │          ││
│  │                          │  │  │ [●Teach] │ [Teach]  │ [●Teach] │ [Teach]  ││
│  │                          │  │  │ [Observe]│ [●Obsrv] │ [Observe]│ [●Obsrv] ││
│  │  ┌──────────────────┐    │  │  │          │          │          │          ││
│  │  │ 🎥 Video On      │    │  │  │ Exercise:│ Exercise:│ Exercise:│ Exercise:││
│  │  │ 🎤 Mic On        │    │  │  │ Fractions│ Essay    │ Division │ Atoms    ││
│  │  │ [Leave Session]  │    │  │  │          │          │          │          ││
│  │  └──────────────────┘    │  │  │ ▓▓▓▓░ 75%│ ▓▓▓▓▓100%│ ▓▓░░░ 30%│ ▓▓▓░░ 50%││
│  │                          │  │  │          │          │          │          ││
│  │  4 participants          │  │  │ [Assign] │ [Assign] │ [Assign] │ [Assign] ││
│  │                          │  │  │ [Message]│ [Message]│ [Message]│ [Message]││
│  └──────────────────────────┘  │  └──────────┴──────────┴──────────┴──────────┘│
│                                │                                                │
│                                │  ← Scroll to see more students →               │
└────────────────────────────────┴────────────────────────────────────────────────┘
```

## Component Breakdown

### Header Bar
```
┌─────────────────────────────────────────────────────────────┐
│ Math Class - Feb 18, 2026 14:30                            │
│ Tutor: Ms. Johnson  •  14:30  •  4 Students  •  🟢 LIVE   │
└─────────────────────────────────────────────────────────────┘
```
- Session title
- Date and time
- Tutor name
- Student count
- Status badge (LIVE/SCHEDULED/COMPLETED)

### Left Panel: Video Grid
```
┌─────────────────────────────────┐
│  Video Screens                  │
│                                 │
│  ┌────────────────────────────┐ │
│  │    Daily.co Iframe         │ │
│  │                            │ │
│  │  Grid of video tiles       │ │
│  │  - Tutor (always visible)  │ │
│  │  - Students (2x2 or more)  │ │
│  │                            │ │
│  └────────────────────────────┘ │
│                                 │
│  Controls:                      │
│  🎥 Video On    🎤 Mic On       │
│  [Leave Session]                │
│                                 │
│  4 participants                 │
└─────────────────────────────────┘
```

### Right Panel: Student Columns
```
┌──────────┬──────────┬──────────┬──────────┐
│ Alice C. │  Bob W.  │ Carol M. │ David L. │ ← Student Names
│  Grade 8 │  Grade 7 │  Grade 6 │  Grade 8 │ ← Grade Levels
│  Math G5 │  Eng G6  │  Math G4 │  Sci G7  │ ← Courses
├──────────┼──────────┼──────────┼──────────┤
│ Session: │ Session: │ Session: │ Session: │ ← Session Time
│  00:45   │  00:38   │  00:42   │  00:35   │   (MM:SS)
│  Total:  │  Total:  │  Total:  │  Total:  │ ← Total Time
│  02:15   │  01:48   │  01:52   │  00:35   │   (HH:MM)
├──────────┼──────────┼──────────┼──────────┤
│● WORKING │ ● IDLE   │🔴NEED HLP│● WORKING │ ← Status
├──────────┼──────────┼──────────┼──────────┤
│ [●Teach] │ [Teach]  │ [●Teach] │ [Teach]  │ ← Mode Toggle
│ [Observe]│ [●Obsrv] │ [Observe]│ [●Obsrv] │   (Tutor only)
├──────────┼──────────┼──────────┼──────────┤
│Exercise: │Exercise: │Exercise: │Exercise: │ ← Current
│Fractions │ Essay    │ Division │ Atoms    │   Exercise
│          │          │          │          │
│▓▓▓▓░ 75% │▓▓▓▓▓100% │▓▓░░░ 30% │▓▓▓░░ 50% │ ← Progress
├──────────┼──────────┼──────────┼──────────┤
│ [Assign] │ [Assign] │ [Assign] │ [Assign] │ ← Quick
│ [Message]│ [Message]│ [Message]│ [Message]│   Actions
└──────────┴──────────┴──────────┴──────────┘
        ← Scroll horizontally for more students →
```

## Color Coding

### Status Indicators
- 🟢 **WORKING** - Green (#10B981) - Student actively working
- 🔴 **WAITING_HELP** - Red (#EF4444) - Student needs assistance  
- 🔵 **COMPLETED** - Blue (#3B82F6) - Exercise completed
- 🟡 **IDLE** - Yellow (#F59E0B) - Student inactive
- ⚪ **NOT_STARTED** - Gray (#6B7280) - Not begun

### Mode Buttons
- **Teach Mode** (Active): Blue background (#2563EB)
- **Observe Mode** (Active): Green background (#059669)
- **Inactive**: Gray background (#E5E7EB)

### Progress Bars
- Completed: Blue (#3B82F6)
- Incomplete: Light Gray (#E5E7EB)

## Responsive Behavior

### Desktop (>1200px)
- Two-panel layout side-by-side
- Video grid: 50% width
- Student columns: 50% width
- 4 student columns visible

### Tablet (768-1200px)
- Two-panel layout stacked
- Video grid: Full width, 60% height
- Student columns: Full width, 40% height
- 2 student columns visible (scroll for more)

### Mobile (<768px)
- Single column vertical layout
- Video grid: Full width, 50% height
- Student columns: Full width, scrollable
- 1 student column visible at a time

## Interaction States

### Video Tile Hover
```
┌────────┐       ┌────────┐
│ Alice  │  →    │ Alice  │ (Border highlight)
│  🎥    │       │  🎥    │ (Name overlay)
└────────┘       └────────┘
```

### Student Column Click
```
┌──────────┐     ┌──────────┐
│ Alice C. │  →  │ Alice C. │ (Blue border)
│  Grade 8 │     │  Grade 8 │ (Light blue bg)
│  ...     │     │  ...     │ (Expanded state)
└──────────┘     └──────────┘
```

### Mode Toggle Click
```
[●Teach]         [Teach]
[Observe]   →    [●Observe]
```

### Quick Action Hover
```
[Assign]    →    [Assign]  (Darker background)
[Message]        [Message] (Hover effect)
```

## Animation & Transitions

### Session Timer
- Updates every second
- Smooth number transition (fade in/out)

### Status Change
- Cross-fade between colors
- 300ms transition duration

### Mode Toggle
- Slide animation (200ms)
- Background color fade

### Progress Bar
- Width transition (500ms ease-in-out)
- Smooth fill animation

## Accessibility

### Keyboard Navigation
- Tab through student columns
- Enter to select/expand
- Arrow keys to scroll columns
- Escape to deselect

### Screen Reader
- Video status announced
- Participant join/leave announced
- Status changes announced
- Timer updates (every minute)

### High Contrast Mode
- Increased border widths
- Stronger color contrasts
- Text size adjustments

## Empty States

### No Students Enrolled
```
┌────────────────────────────────┐
│  No students enrolled          │
│                                │
│  Add students to this session  │
│  to start teaching.            │
│                                │
│  [Add Students]                │
└────────────────────────────────┘
```

### Video Room Not Created
```
┌────────────────────────────────┐
│  Video session not started     │
│                                │
│  Please wait for the tutor     │
│  to start the video session.   │
│                                │
│  [Refresh]                     │
└────────────────────────────────┘
```

### Connection Error
```
┌────────────────────────────────┐
│  ⚠️ Connection Error           │
│                                │
│  Failed to join video call.    │
│  Check your internet           │
│  connection and try again.     │
│                                │
│  [Reload Page]                 │
└────────────────────────────────┘
```

## Implementation Notes

### Technologies
- **Video:** Daily.co iframe (WebRTC)
- **Layout:** CSS Grid + Flexbox
- **Animations:** CSS transitions
- **State:** React hooks (useState, useEffect)
- **Timers:** setInterval (1-second updates)

### Performance Optimization
- Debounce scroll events
- Virtualize student columns (for 10+ students)
- Lazy load video streams
- Optimize re-renders with React.memo

### Browser Support
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

---

This visual specification matches the implemented two-panel layout with video screens on the left and student information columns on the right, as per the new requirement.
