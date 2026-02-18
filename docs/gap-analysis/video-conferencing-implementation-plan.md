# In-Built Video Conferencing Implementation Plan

## Executive Summary

This document outlines the implementation strategy for replacing external video conferencing links (Microsoft Teams, Zoom) with an embedded, in-built video conferencing solution that supports the multi-student tutoring model.

**Problem Statement**: The current system uses external links to Microsoft Teams/Zoom for sessions. We need an embedded video tool that displays multiple student video streams simultaneously on a tutor control center page, integrated with the whiteboard and session management features.

**Solution**: Implement WebRTC-based video conferencing using a managed SDK (Daily.co or Jitsi Meet) with SFU architecture to support 5+ concurrent video streams per session.

## Current State Analysis

### Existing Infrastructure ✅

**Database Schema:**
- `Session` model with `provider`, `providerMeetingId`, `joinUrl` fields
- `StudentSessionEnrollment` for multi-student session tracking
- `SessionPresenceLog` for join/leave tracking
- `SessionStatus` enum (SCHEDULED, LIVE, COMPLETED, CANCELLED)

**WebSocket Implementation:**
- Socket.io server at `/api/socket`
- Authentication middleware
- Events: `join-session`, `heartbeat`, `canvas-update`, `help-request`
- Student presence tracking (JOIN, LEAVE, HEARTBEAT, DISCONNECT)

**UI Components:**
- `LiveSessionDashboard` - Main tutor control center
- `StudentGridView` - Student status display
- `SessionHeader` - Session controls (Start/Pause/End)
- `HelpRequestPanel` - Real-time help request handling

**API Endpoints:**
- `POST /api/academic/sessions/create` - Session creation
- `POST /api/academic/sessions/manage` - Multi-student management
- WebSocket endpoint for real-time updates

### Missing Components ❌

**Video Infrastructure:**
- No WebRTC implementation (peer-to-peer or SFU)
- No media capture/streaming libraries
- No video SDK integration
- No actual video/audio transmission logic
- No recording infrastructure
- No transcription service

**Performance & Quality:**
- No bandwidth adaptation
- No connection quality monitoring
- No stream quality management
- No fallback mechanisms for poor connectivity

**Media Management:**
- No recording storage
- No transcription processing
- No video codec handling

## Technology Recommendations

### Option 1: Daily.co (Recommended) ⭐

**Pros:**
- Managed infrastructure (SFU built-in)
- React SDK with TypeScript support
- Built-in recording and transcription
- Scalable to 200+ participants
- Excellent documentation and support
- Privacy-first, HIPAA compliant
- Grid/active speaker layouts out-of-box
- Network quality indicators
- Screen sharing built-in

**Cons:**
- Paid service ($0.0015/min/participant)
- External dependency
- Requires internet connectivity

**Implementation Complexity:** Low (1-2 weeks)

**Code Sample:**
```typescript
import DailyIframe from '@daily-co/daily-js';

// Create room
const room = await fetch('https://api.daily.co/v1/rooms', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` },
  body: JSON.stringify({
    name: `session-${sessionId}`,
    privacy: 'private',
    properties: {
      enable_recording: 'cloud',
      enable_transcription: true,
      max_participants: 10
    }
  })
});

// Join call
const callFrame = DailyIframe.createFrame({
  showLeaveButton: true,
  iframeStyle: { width: '100%', height: '100%' }
});
await callFrame.join({ url: room.url, token: userToken });
```

### Option 2: Jitsi Meet

**Pros:**
- Open source and free
- Self-hosted option available
- Good WebRTC implementation
- React integration available
- Recording support (Jibri)

**Cons:**
- Requires self-hosting infrastructure
- More complex setup
- Limited managed service options
- Performance tuning needed for 5+ participants
- Recording requires additional setup

**Implementation Complexity:** Medium-High (3-4 weeks)

### Option 3: Custom WebRTC + Mediasoup

**Pros:**
- Full control over infrastructure
- No per-minute costs
- Highly customizable
- Best performance potential

**Cons:**
- Very high complexity
- Requires WebRTC expertise
- Infrastructure maintenance
- Signaling server implementation
- TURN/STUN server setup
- 8-12 weeks implementation time

**Implementation Complexity:** Very High (8-12 weeks)

**Recommendation:** **Use Daily.co** for fastest time-to-market and best developer experience. Provides all required features with minimal infrastructure overhead.

## Architecture Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Tutor Control Center                     │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │  Video Grid (R)  │  │  Student Columns (L)           │  │
│  │  ┌────┐ ┌────┐  │  │  ┌──────┬──────┬──────┬──────┐ │  │
│  │  │Std1│ │Std2│  │  │  │Std1  │Std2  │Std3  │Std4  │ │  │
│  │  │00:45│ │01:12│  │  │  │Teach │Observ│Teach │Observ│ │  │
│  │  └────┘ └────┘  │  │  │Ex1   │Ex2   │Ex3   │Ex1   │ │  │
│  │  ┌────┐ ┌────┐  │  │  │75%   │100%  │30%   │50%   │ │  │
│  │  │Std3│ │Std4│  │  │  └──────┴──────┴──────┴──────┘ │  │
│  │  │00:32│ │00:58│  │  │                                │  │
│  │  └────┘ └────┘  │  │  │  [Help Requests Panel]        │  │
│  └──────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         ├────────── WebSocket Events ────────┤
         │                                    │
    ┌────▼─────────────────────────────────▼────┐
    │         Next.js API + Socket.io           │
    │  ┌──────────────────────────────────────┐ │
    │  │  Video Service Layer                 │ │
    │  │  - Room creation                     │ │
    │  │  - Token generation                  │ │
    │  │  - Recording management              │ │
    │  └──────────────────────────────────────┘ │
    └────┬──────────────────────────────────┬───┘
         │                                  │
    ┌────▼────────┐                   ┌────▼─────────┐
    │  Daily.co   │                   │  PostgreSQL  │
    │  Video API  │                   │  + Prisma    │
    └─────────────┘                   └──────────────┘
```

### Data Flow

**Session Start:**
1. Tutor creates session → `POST /api/sessions/manage`
2. API calls Video Service → Creates Daily.co room
3. Store `videoRoomUrl` in Session record
4. Generate join tokens for tutor + students
5. Return session with video metadata

**Student Joins:**
1. Student opens session page → Fetch session data
2. Load video SDK with student token
3. Join Daily.co room
4. Emit `join-session` WebSocket event
5. Server broadcasts to tutor's dashboard
6. Update `SessionPresenceLog` with join time

**Real-time Updates:**
1. Video SDK reports participant events
2. Frontend emits status changes via WebSocket
3. Server validates and broadcasts to session room
4. Tutor dashboard updates student grid
5. Track active time in `StudentSessionEnrollment.activeMs`

### Database Schema Extensions

```prisma
model Session {
  id                String              @id @default(uuid())
  
  // Existing fields...
  provider          SessionProvider     @default(CUSTOM)
  providerMeetingId String?            // Deprecated for external
  joinUrl           String?            // Deprecated for external
  
  // NEW: Video conferencing fields
  videoRoomId       String?            @unique
  videoRoomUrl      String?
  recordingUrl      String?
  recordingStartedAt DateTime?
  transcriptionUrl  String?
  videoProvider     VideoProvider      @default(DAILY)
  
  videoParticipants VideoParticipant[]
  videoRecordings   VideoRecording[]
}

enum VideoProvider {
  DAILY
  JITSI
  CUSTOM
  NONE
}

model VideoParticipant {
  id                String              @id @default(uuid())
  sessionId         String
  userId            String
  participantId     String             // Daily.co participant ID
  joinedAt          DateTime
  leftAt            DateTime?
  durationMs        Int                @default(0)
  videoEnabled      Boolean            @default(true)
  audioEnabled      Boolean            @default(true)
  screenShareEnabled Boolean           @default(false)
  
  session           Session            @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user              User               @relation(fields: [userId], references: [id])
  
  @@index([sessionId])
  @@index([userId])
  @@index([participantId])
}

model VideoRecording {
  id                String              @id @default(uuid())
  sessionId         String
  recordingId       String             @unique // Daily.co recording ID
  startedAt         DateTime
  endedAt           DateTime?
  durationMs        Int?
  downloadUrl       String?
  streamUrl         String?
  transcriptionUrl  String?
  status            RecordingStatus    @default(PROCESSING)
  
  session           Session            @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@index([sessionId])
  @@index([status])
}

enum RecordingStatus {
  PROCESSING
  READY
  FAILED
  DELETED
}
```

## Implementation Phases

### Phase 1: Video Infrastructure (Week 1-2)

**Goal:** Set up basic video conferencing capability

**Tasks:**
1. Install Daily.co SDK
   ```bash
   npm install @daily-co/daily-js @daily-co/daily-react
   ```

2. Create Video Service (`lib/video-service.ts`)
   - Room creation/deletion
   - Token generation (tutor vs student permissions)
   - Recording start/stop
   - Webhook handling

3. Add API endpoints:
   - `POST /api/sessions/[id]/video/create` - Create video room
   - `GET /api/sessions/[id]/video/token` - Get join token
   - `POST /api/sessions/[id]/video/recording/start`
   - `POST /api/sessions/[id]/video/recording/stop`
   - `POST /api/webhooks/daily` - Handle Daily.co webhooks

4. Update Session model schema
   - Run `npx prisma db push`
   - Update seed script

5. Environment variables:
   ```env
   DAILY_API_KEY=your_daily_api_key
   DAILY_DOMAIN=your-domain.daily.co
   ```

**Deliverables:**
- ✅ Video service layer
- ✅ Database schema updated
- ✅ API endpoints functional
- ✅ Basic tests

### Phase 2: Video UI Components (Week 2-3)

**Goal:** Create tutor and student video interfaces

**Tasks:**
1. Create `VideoGridContainer` component
   ```tsx
   // components/video/VideoGridContainer.tsx
   - Manages Daily.co call frame
   - Handles participant events
   - Displays video tiles in grid layout
   ```

2. Create `StudentVideoTile` component
   ```tsx
   // components/video/StudentVideoTile.tsx
   - Video stream display
   - Student name overlay
   - Session timer (current session time)
   - Total interaction time
   - Status indicator (active/idle)
   - Mute/camera controls
   ```

3. Create `VideoControls` component
   - Mute/unmute microphone
   - Camera on/off
   - Screen share toggle
   - Leave session button

4. Update `LiveSessionDashboard`
   - Integrate VideoGridContainer
   - Layout: Video grid on right, student columns on left
   - Responsive design (4-column grid, scrollable for 5+)

5. Create student video page
   - `/dashboard/student/sessions/[id]/video`
   - Single video view
   - Join session button
   - Minimal controls

**Deliverables:**
- ✅ Video grid UI component
- ✅ Student video tiles with timers
- ✅ Tutor control center integration
- ✅ Student join page

### Phase 3: Real-Time Integration (Week 3-4)

**Goal:** Sync video state with session management

**Tasks:**
1. Extend WebSocket events:
   ```typescript
   // New events
   'video:participant-joined'
   'video:participant-left'
   'video:track-started' (camera/mic)
   'video:track-stopped'
   'video:recording-started'
   'video:recording-stopped'
   ```

2. Implement presence tracking:
   - Update `VideoParticipant` on join/leave
   - Calculate `durationMs` on leave
   - Update `StudentSessionEnrollment.activeMs`

3. Sync video status with session status:
   - Auto-create video room on session start
   - Auto-end video call on session end
   - Handle tutor disconnect/reconnect

4. Recording management:
   - Auto-start recording when session goes LIVE
   - Stop recording on session COMPLETED
   - Store recording URLs in database

5. Create webhook handler:
   - `POST /api/webhooks/daily`
   - Handle `recording.ready`, `recording.error`
   - Update `VideoRecording` status

**Deliverables:**
- ✅ WebSocket video events
- ✅ Presence tracking integrated
- ✅ Recording automation
- ✅ Webhook processing

### Phase 4: Tutor Control Features (Week 4-5)

**Goal:** Implement teach/observe modes and per-student controls

**Tasks:**
1. Add per-student column layout:
   ```tsx
   // Each column shows:
   - Student name + grade level
   - Teach/Observe mode toggle
   - Current exercise
   - Progress percentage
   - Quick actions (assign exercise, send help)
   ```

2. Implement mode toggle:
   - TEACH: Tutor actively instructing, show assigned content
   - OBSERVE: Student working independently, show progress

3. Exercise tracking per student:
   - Display current exercise from `StudentSessionEnrollment.exerciseContent`
   - Show completion progress
   - Real-time updates via WebSocket

4. Quick actions:
   - Assign new exercise (modal)
   - Mark exercise complete
   - Send help/message
   - View student details (sidebar)

5. Session info display:
   - Session ID
   - Current lesson for each student
   - Link to course content

**Deliverables:**
- ✅ Per-student column UI
- ✅ Teach/Observe toggle
- ✅ Exercise tracking display
- ✅ Quick action buttons

### Phase 5: Performance & Quality (Week 5-6)

**Goal:** Optimize for concurrent video streams and handle edge cases

**Tasks:**
1. Bandwidth optimization:
   - Implement adaptive bitrate
   - Reduce video quality for 5+ participants
   - Monitor network quality (Daily.co built-in)

2. Handle reconnection:
   - Auto-rejoin on disconnect
   - Show reconnecting status
   - Resume timer on rejoin

3. Performance monitoring:
   - Track video FPS, bitrate, packet loss
   - Log performance metrics
   - Alert tutor on quality issues

4. Load testing:
   - Test with 5 concurrent video streams
   - Test with 10 concurrent sessions
   - Measure CPU/memory usage

5. Error handling:
   - Camera/mic permission denied
   - Browser compatibility
   - Network failures
   - Token expiration

**Deliverables:**
- ✅ Bandwidth adaptation
- ✅ Reconnection handling
- ✅ Performance monitoring
- ✅ Error handling

### Phase 6: Recording & Transcription (Week 6-7)

**Goal:** Enable session recording and auto-transcription

**Tasks:**
1. Recording UI:
   - Record button in session header
   - Recording indicator (red dot)
   - Auto-recording option

2. Recording management API:
   - List recordings: `GET /api/sessions/[id]/recordings`
   - Download recording: `GET /api/recordings/[id]/download`
   - Delete recording: `DELETE /api/recordings/[id]`

3. Transcription processing:
   - Auto-request transcription from Daily.co
   - Store transcription URL
   - Display transcription in session notes

4. Recording playback:
   - Video player component
   - Seek controls
   - Playback speed

5. Storage management:
   - Archive old recordings (S3/CloudFlare R2)
   - Delete recordings after retention period
   - Backup important sessions

**Deliverables:**
- ✅ Recording controls
- ✅ Recording management API
- ✅ Transcription integration
- ✅ Playback UI

## UI/UX Design

### Tutor Control Center Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Session: Math Class - Feb 18, 2026 14:30                          │
│  [● REC] [Start] [Pause] [End]      Timer: 00:45:23      Help: 2   │
├──────────────────────────┬──────────────────────────────────────────┤
│                          │  ┌─────────────────────────────────────┐ │
│  STUDENT COLUMNS (Left)  │  │       VIDEO GRID (Right)            │ │
│  [Scrollable beyond 5]   │  │  ┌────────┐  ┌────────┐            │ │
│                          │  │  │ Alice  │  │  Bob   │            │ │
│  ┌────────────────────┐  │  │  │ 🎥     │  │  🎥    │            │ │
│  │ Alice Chen         │  │  │  │ 00:45  │  │  00:38 │            │ │
│  │ Grade 8 → Math G5  │  │  │  └────────┘  └────────┘            │ │
│  │ [●Teach] [Observe] │  │  │  ┌────────┐  ┌────────┐            │ │
│  │                    │  │  │  │  Carol │  │  David │            │ │
│  │ Exercise: Fractions│  │  │  │  🎥    │  │  🖼️    │ (offline) │ │
│  │ Progress: ▓▓▓▓░ 75%│  │  │  │  00:42 │  │  00:00 │            │ │
│  │                    │  │  │  └────────┘  └────────┘            │ │
│  │ [Assign] [Help]    │  │  │                                     │ │
│  └────────────────────┘  │  └─────────────────────────────────────┘ │
│                          │                                          │
│  ┌────────────────────┐  │  ┌─────────────────────────────────────┐ │
│  │ Bob Williams       │  │  │       HELP REQUESTS                 │ │
│  │ Grade 7 → Eng G6   │  │  │  🔴 URGENT: Alice - Question 3      │ │
│  │ [Teach] [●Observe] │  │  │  🟡 HIGH: David - Need help         │ │
│  │                    │  │  │  [Respond] [Dismiss]                │ │
│  │ Exercise: Essay    │  │  └─────────────────────────────────────┘ │
│  │ Progress: ▓▓▓▓▓100%│  │                                          │
│  │                    │  │                                          │
│  │ [View] [Next]      │  │                                          │
│  └────────────────────┘  │                                          │
└──────────────────────────┴──────────────────────────────────────────┘
```

**Key Features:**
- **Left Side:** Scrollable student columns (4-5 visible, rest scrollable)
- **Right Side:** Video grid with timers (session time + total time)
- **Bottom Right:** Help request panel
- **Top:** Session controls and timer

### Student Video Tile Design

```
┌──────────────────┐
│  Alice Chen      │ ← Name overlay
│  ┌────────────┐  │
│  │            │  │ ← Video stream
│  │    🎥      │  │
│  │            │  │
│  └────────────┘  │
│  Session: 00:45  │ ← Current session time
│  Total:   02:15  │ ← Total interaction time
│  ● Active        │ ← Status indicator
└──────────────────┘
```

**Responsive Breakpoints:**
- Desktop (>1200px): 4-column grid
- Tablet (768-1200px): 2-column grid
- Mobile (<768px): Single column, vertical scroll

## Testing Strategy

### Unit Tests
- Video service functions (room creation, token generation)
- WebSocket event handlers
- Participant tracking calculations
- Recording management logic

### Integration Tests
- Session lifecycle with video
- Multi-participant joining/leaving
- Recording start/stop
- Webhook processing

### E2E Tests (Playwright)
```typescript
test('Tutor can start session with video', async ({ page }) => {
  await page.goto('/dashboard/tutor/sessions/session-123/live');
  await page.click('button:has-text("Start Session")');
  
  // Verify video grid appears
  await expect(page.locator('.video-grid')).toBeVisible();
  
  // Verify recording starts
  await expect(page.locator('.recording-indicator')).toBeVisible();
});

test('Student can join video session', async ({ page }) => {
  await page.goto('/dashboard/student/sessions/session-123/video');
  await page.click('button:has-text("Join Session")');
  
  // Verify video appears
  await expect(page.locator('video')).toBeVisible();
  
  // Verify controls
  await expect(page.locator('button[aria-label="Mute"]')).toBeVisible();
});
```

### Performance Tests
- Load test with 5 concurrent video streams
- Bandwidth usage monitoring
- CPU/memory profiling
- Network latency impact

## Security & Privacy

### Video Access Control
- Generate time-limited tokens (1-hour expiry)
- Validate user permissions before token generation
- Use Daily.co's privacy settings (private rooms)
- Enforce center-based multi-tenancy

### Recording Privacy
- RBAC for recording access (TEACHER, CENTER_ADMIN only)
- Encrypted storage for recordings
- Auto-delete after retention period (90 days default)
- Audit log all recording access

### GDPR Compliance
- User consent for recording (checkbox before join)
- Right to delete recordings
- Data export capability
- Privacy policy update

## Deployment Considerations

### Infrastructure
- No additional servers needed (Daily.co is managed)
- Webhook endpoint must be publicly accessible
- SSL certificate required (already configured)

### Environment Variables
```env
# Daily.co
DAILY_API_KEY=your_api_key_here
DAILY_DOMAIN=your-domain.daily.co
DAILY_WEBHOOK_SECRET=webhook_secret_for_validation

# Recording Storage (optional)
VIDEO_STORAGE_PROVIDER=cloudflare-r2  # or s3
VIDEO_STORAGE_BUCKET=session-recordings
VIDEO_RETENTION_DAYS=90
```

### Cost Estimation
- Daily.co: $0.0015/minute/participant
- 5 students × 60 minutes × $0.0015 = $0.45/session
- 100 sessions/month = $45/month
- Recording storage: ~$5/month (CloudFlare R2)
- **Total: ~$50/month for 100 sessions**

### Monitoring
- Track video quality metrics
- Monitor Daily.co API usage
- Alert on high error rates
- Dashboard for video statistics

## Migration Plan

### Phase 1: Parallel Run (Week 1-2)
- Deploy video features to staging
- Keep existing Teams/Zoom links active
- Beta test with select tutors

### Phase 2: Soft Launch (Week 3-4)
- Enable video for 10% of sessions
- Collect feedback
- Monitor performance metrics

### Phase 3: Full Rollout (Week 5-6)
- Enable video for all new sessions
- Migrate existing sessions gradually
- Deprecate Teams/Zoom link generation

### Phase 4: Cleanup (Week 7-8)
- Remove unused provider fields
- Update documentation
- Archive migration scripts

## Success Metrics

### Technical KPIs
- Video connection success rate: >95%
- Average connection time: <5 seconds
- Video quality: >720p for 95% of sessions
- Packet loss: <2%
- Reconnection time: <10 seconds

### Business KPIs
- Tutor adoption rate: >80% within 2 months
- Student engagement (video-on time): >75%
- Session completion rate improvement: >10%
- Help request response time: <2 minutes

### User Satisfaction
- Tutor NPS score: >50
- Student satisfaction: >4.5/5
- Support ticket reduction: >30%

## Risk Mitigation

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Daily.co service outage | High | Low | Fallback to Teams links |
| Bandwidth issues | Medium | Medium | Adaptive bitrate, quality warnings |
| Browser compatibility | Medium | Low | Test on Chrome, Firefox, Safari |
| Token expiration during session | Low | Low | Auto-refresh tokens |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User resistance to change | Medium | Medium | Training, gradual rollout |
| Higher costs than expected | Low | Medium | Usage monitoring, tier pricing |
| Privacy concerns | High | Low | Clear privacy policy, consent flow |

## Next Steps

1. **Immediate (Week 1):**
   - Get Daily.co API key (free tier: 1000 minutes/month)
   - Set up development environment
   - Create proof-of-concept with 2 participants

2. **Short-term (Week 2-3):**
   - Implement video service layer
   - Update database schema
   - Create basic UI components

3. **Medium-term (Week 4-6):**
   - Complete tutor control center
   - Implement recording
   - Performance optimization

4. **Long-term (Week 7-8):**
   - Production deployment
   - User training
   - Documentation

## Conclusion

Implementing in-built video conferencing with Daily.co provides:
- **Fast time-to-market:** 6-8 weeks vs 3-6 months for custom WebRTC
- **Lower risk:** Managed infrastructure, proven technology
- **Better UX:** Seamless integration with session management
- **Scalability:** Supports 5+ concurrent streams with SFU architecture
- **Cost-effective:** ~$50/month for 100 sessions

The multi-student video grid with per-student columns and teach/observe modes will transform the tutoring experience, enabling tutors to effectively manage 4-5 students simultaneously in a single session.

**Recommended Approval:** Proceed with Daily.co implementation as outlined in Phase 1-6.
