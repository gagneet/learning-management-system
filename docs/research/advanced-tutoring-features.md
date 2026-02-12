# Advanced Tutoring Features - Research & Recommendations

**Date:** February 12, 2026  
**Status:** Research & Planning Phase  
**Priority:** Phase 4 Implementation

## Overview

This document outlines the research findings and architectural recommendations for implementing advanced hybrid tutoring features in the LMS. These features address the unique requirements of a multi-student, multi-level tutoring environment where one tutor manages up to 5 students simultaneously, each potentially working on different subjects and learning levels.

---

## 1. Multi-Student Session Monitoring ("Tutor Control Center")

### Current State
- Sessions support multiple students with individual course/lesson assignments (✅ Implemented)
- Session model includes `StudentSessionEnrollment` for personalized content tracking
- Basic session details page shows enrolled students and attendance

### Gap
The tutor needs a real-time "control center" dashboard to:
- View all 5 student screens simultaneously
- Monitor individual student progress in real-time
- See what each student is currently working on
- Provide selective assistance without disrupting others

### Recommended Solution

#### Architecture: WebSocket-Based Multi-Stream Dashboard

```typescript
// Conceptual Architecture
┌─────────────────────────────────────────────────────────────┐
│                   Tutor Control Center                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Student 1│  │ Student 2│  │ Student 3│  │ Student 4│   │
│  │ Gr 7→4📝 │  │ Gr 7→4📝 │  │ Gr 7→5📐 │  │ Gr 7→6📚 │   │
│  │ [Canvas] │  │ [Canvas] │  │ [Canvas] │  │ [Canvas] │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↑           ↑           ↑           ↑
         └───────────┴───────────┴───────────┴────WebSocket───┐
                                                                │
┌───────────────────────────────────────────────────────────┐  │
│                  WebSocket Server (Next.js API)            │◄─┘
│  - Manages 5 separate student streams per session          │
│  - Filters data by user role (students see only their own) │
│  - Broadcasts canvas updates, progress, activity           │
└───────────────────────────────────────────────────────────┘
         ↓           ↓           ↓           ↓
    [Student 1] [Student 2] [Student 3] [Student 4]
    (sees own)  (sees own)  (sees own)  (sees own)
```

#### Implementation Steps

1. **WebSocket Infrastructure**
   ```bash
   npm install socket.io socket.io-client
   ```
   
   Create `/app/api/socket/route.ts` for Socket.IO integration with Next.js:
   ```typescript
   // Socket.IO server for real-time communication
   // Handles: canvas updates, progress tracking, chat messages
   ```

2. **Tutor Control Center Page**
   Create `/app/dashboard/tutor/sessions/[id]/control-center/page.tsx`:
   - Grid layout with 5 student panels (responsive: 2x3 on desktop, vertical stack on mobile)
   - Each panel shows:
     - Student name + current subject/level (e.g., "Grade 7 → English Grade 4")
     - Live canvas preview (read-only mirrored view)
     - Progress indicators
     - Quick action buttons (help request, direct message)

3. **Student Canvas Component**
   - Students work on their own dedicated canvas
   - Canvas state broadcasts to WebSocket server
   - Server filters and forwards only to authorized tutor for that session

4. **Data Flow**
   ```typescript
   // Student emits canvas updates
   socket.emit('canvas:update', {
     sessionId: 'xxx',
     studentId: 'yyy',
     canvasData: { /* drawing data */ }
   });

   // Server validates and broadcasts to tutor only
   io.to(`tutor:${tutorId}`).emit('student:canvas', {
     studentId: 'yyy',
     canvasData: { /* drawing data */ }
   });
   ```

#### Estimated Effort
- **Development:** 3-5 days (1 developer)
- **Testing:** 2 days
- **Dependencies:** Socket.IO, canvas library (Fabric.js or Excalidraw)

---

## 2. Dynamic Academic Leveling (Already Implemented ✅)

### Solution: Subject-Level JSON Field

The `AcademicProfile.subjectLevels` field (added in Phase 3) supports tracking individual subject learning levels:

```json
{
  "English": {
    "actualGrade": "Grade 7",
    "targetLevel": "Grade 4",
    "currentLevel": "Grade 4",
    "notes": "Working on comprehension"
  },
  "Math": {
    "actualGrade": "Grade 7",
    "targetLevel": "Grade 5",
    "currentLevel": "Grade 5",
    "notes": "Advanced algebra"
  }
}
```

### Next Steps (UI)
- Create admin/supervisor UI to set and manage subject levels
- Display on tutor's session view: "Student A (Grade 7) → English Grade 4"
- Filter/assign appropriate lesson content based on target level

---

## 3. Physical Paper Assessment Workflow

### Current Gap
No workflow for:
- Students submitting handwritten work via photo/scan
- Tutors/assessors marking physical papers digitally
- Storing assessment results linked to session/student

### Recommended Solution: Assessment Upload Module

#### Database Schema Extension (Already Partially Exists)
```prisma
// Leverage existing StudentSessionEnrollment.assessmentData JSON field
// Store: { imageUrl, assessorNotes, score, gradedAt, gradedById }
```

#### Implementation

1. **Student Upload Component**
   Create `/components/AssessmentUpload.tsx`:
   - Mobile-friendly file picker (camera or gallery)
   - Image compression before upload (reduce size for fast transmission)
   - Upload to cloud storage (AWS S3, Cloudinary, or Vercel Blob)
   - Store URL in `StudentSessionEnrollment.assessmentData`

2. **Assessor View Component**
   Create `/app/dashboard/tutor/assessments/[enrollmentId]/page.tsx`:
   - Display uploaded image at high resolution
   - Digital ink overlay for marking (using Fabric.js or similar)
   - Form fields for score, feedback, notes
   - Save marked version + data back to `assessmentData`

3. **API Endpoints**
   - `POST /api/assessments/upload` - Upload student work
   - `PATCH /api/assessments/[enrollmentId]/grade` - Submit grading

4. **Workflow**
   ```
   Student → Upload Photo → Stored in assessmentData
      ↓
   Tutor/Assessor → View in Assessor Dashboard → Mark with digital ink
      ↓
   Save Graded Work → Update assessmentData with score/notes
      ↓
   Student/Parent → View graded work in their dashboard
   ```

#### Estimated Effort
- **Development:** 4-6 days (1 developer)
- **Testing:** 2 days
- **Dependencies:** Image upload library, cloud storage (S3/Cloudinary), digital ink library

---

## 4. Collaborative Whiteboard Integration

### Requirements
- Real-time collaborative drawing for live sessions
- Students draw on their own layer (isolated)
- Tutor can see all layers and draw on any layer
- Persistent canvas state (saved to session)

### Recommended Tools

#### Option A: Excalidraw (Open Source)
- **Pros:** Free, excellent UX, React-friendly, supports real-time collaboration
- **Cons:** Requires WebSocket backend for live sync
- **Effort:** Medium (2-3 days integration)
- **URL:** https://github.com/excalidraw/excalidraw

```typescript
import { Excalidraw } from "@excalidraw/excalidraw";

<Excalidraw
  initialData={{ elements: [...], appState: {...} }}
  onChange={(elements, appState) => {
    // Emit to WebSocket
    socket.emit('canvas:update', { elements, appState });
  }}
/>
```

#### Option B: Fabric.js (More Control)
- **Pros:** Full control, lightweight, rich drawing features
- **Cons:** Requires custom UI, more setup for collaboration
- **Effort:** High (4-5 days integration)
- **URL:** http://fabricjs.com/

```typescript
import { Canvas } from 'fabric';

const canvas = new Canvas('canvas-element');
canvas.on('object:modified', () => {
  socket.emit('canvas:update', canvas.toJSON());
});
```

#### Option C: Tldraw (Modern, TypeScript-first)
- **Pros:** TypeScript-first, modern API, great for diagrams
- **Cons:** Newer library, smaller community
- **Effort:** Medium (3-4 days integration)
- **URL:** https://www.tldraw.com/

### Recommended Approach
**Start with Excalidraw** for rapid prototyping:
1. Embed Excalidraw in session page
2. Use WebSocket to sync drawing state
3. Implement layer-based permissions (student restricted to their layer)
4. Save final canvas state to `StudentSessionEnrollment.exerciseContent`

#### Architecture
```typescript
// Tutor sees all layers
<Excalidraw
  viewModeEnabled={false}
  initialData={{
    elements: [...allStudentLayers],
    appState: { viewMode: false }
  }}
/>

// Student sees only their layer
<Excalidraw
  viewModeEnabled={false}
  initialData={{
    elements: [...studentOwnLayer],
    appState: { collaborators: [tutorId] }
  }}
/>
```

#### Estimated Effort
- **Development:** 3-5 days (1 developer)
- **Testing:** 2 days
- **Dependencies:** Excalidraw, WebSocket server

---

## 5. Microsoft Teams for Education API (Advanced)

### Can Teams API Support Multi-Canvas View?

#### Research Findings
Microsoft Teams for Education provides APIs through Microsoft Graph API, but there are significant **limitations** for the "multi-canvas" tutor view requirement:

**Teams API Capabilities:**
- ✅ Create and manage Teams meetings
- ✅ Get meeting attendance reports
- ✅ Access meeting recordings
- ✅ Manage meeting participants

**Teams API Limitations:**
- ❌ **No screen mirroring/monitoring API** - Cannot view student screens through Teams API
- ❌ No direct access to student application states
- ❌ No built-in canvas or whiteboard API (Teams uses third-party integrations)

**Teams Whiteboard:**
- Teams has a "Whiteboard" app, but it's a separate Microsoft product
- API access requires Microsoft Whiteboard API (limited availability)
- Not suitable for granular per-student layer control

#### Verdict: Teams API Cannot Directly Support Multi-Canvas View

**Why:**
- Teams is designed for video conferencing, not application state sharing
- Screen sharing is one-way (presenter → viewers), not multi-way monitoring
- No API for "supervisor view" of multiple participant screens

#### Alternative: Hybrid Approach

Use Teams for what it does best (video/audio) + custom LMS for canvas monitoring:

1. **Teams Integration (for video conferencing)**
   ```typescript
   // Use Graph API to create Teams meeting
   POST https://graph.microsoft.com/v1.0/me/onlineMeetings
   {
     "subject": "Tutoring Session - Student A",
     "participants": { /* tutor + student */ }
   }
   ```
   
   - Store meeting `joinUrl` in `Session.meetingLink`
   - Use Teams for voice/video communication

2. **Custom LMS Canvas (for work monitoring)**
   - Implement WebSocket-based multi-stream dashboard (as described in Section 1)
   - Students work in LMS browser tab, join Teams for audio/video
   - Tutor has two views: Teams call + LMS control center

#### Hybrid Workflow
```
Tutor's Setup:
┌─────────────────────┐  ┌──────────────────────────────────┐
│  Teams Video Call   │  │  LMS Tutor Control Center        │
│  (Audio/Video)      │  │  (5 Student Canvases)            │
│  - Student faces    │  │  - Real-time work monitoring     │
│  - Screen share     │  │  - Progress tracking             │
└─────────────────────┘  └──────────────────────────────────┘
```

---

## 6. Implementation Priorities

### Phase 4A: Foundation (2-3 weeks)
1. ✅ WebSocket infrastructure (Socket.IO setup)
2. ✅ Tutor Control Center page (basic grid layout)
3. ✅ Student canvas component (Excalidraw integration)
4. ✅ Real-time canvas sync (WebSocket events)

### Phase 4B: Assessment Workflow (2 weeks)
1. ✅ Assessment upload component (mobile-friendly)
2. ✅ Assessor marking interface (digital ink overlay)
3. ✅ Assessment API endpoints
4. ✅ Graded work viewing for students/parents

### Phase 4C: Teams Integration (1 week)
1. ✅ Microsoft Graph API integration
2. ✅ Teams meeting creation from session
3. ✅ Store meeting links in Session model
4. ✅ Hybrid workflow documentation

### Phase 4D: Polish & Testing (1-2 weeks)
1. Load testing (5 concurrent students)
2. Mobile responsiveness
3. Error handling and reconnection logic
4. User training documentation

---

## 7. Technical Stack Recommendations

### Required Dependencies
```json
{
  "socket.io": "^4.7.0",
  "socket.io-client": "^4.7.0",
  "@excalidraw/excalidraw": "^0.17.0",
  "fabric": "^5.3.0",
  "@microsoft/microsoft-graph-client": "^3.0.7",
  "aws-sdk": "^2.1500.0",
  "sharp": "^0.33.0"
}
```

### Infrastructure Requirements
- **WebSocket Server:** Next.js API route with Socket.IO (can run on same Vercel/Node server)
- **File Storage:** AWS S3 or Cloudinary for assessment images
- **Database:** Current PostgreSQL (no changes needed)

---

## 8. Security Considerations

### Data Privacy
- WebSocket messages must be validated and filtered by session membership
- Students can only see/update their own canvas data
- Tutors can only access students in their assigned sessions

### Authorization Middleware
```typescript
// Validate socket connections
io.use((socket, next) => {
  const sessionId = socket.handshake.query.sessionId;
  const userId = socket.handshake.query.userId;
  
  // Verify user is enrolled in session (student) or is the tutor
  if (isAuthorized(userId, sessionId)) {
    next();
  } else {
    next(new Error('Unauthorized'));
  }
});
```

### Image Upload Security
- Validate file types (PNG, JPG, PDF only)
- Limit file size (max 10MB)
- Scan for malware (if using third-party service like Cloudinary)
- Use signed URLs for S3 uploads (temporary access)

---

## 9. Cost Estimates

### Development Costs (1 Full-Stack Developer)
- **Phase 4A (Foundation):** 2-3 weeks @ $5,000-7,500
- **Phase 4B (Assessment):** 2 weeks @ $5,000
- **Phase 4C (Teams Integration):** 1 week @ $2,500
- **Phase 4D (Testing):** 1-2 weeks @ $2,500-5,000
- **Total:** $15,000-20,000

### Infrastructure Costs (Monthly)
- **WebSocket Server:** Included in existing hosting (Vercel/AWS)
- **File Storage (AWS S3):** ~$5-20/month (for 1000 assessments)
- **Microsoft Graph API:** Free tier (up to 10,000 requests/day)
- **Total:** ~$5-20/month additional

---

## 10. Next Steps

1. **Review & Approve:** Stakeholder review of this research document
2. **Prototype:** Build MVP of Tutor Control Center (1 student only)
3. **User Testing:** Test with 1 tutor + 1 student, gather feedback
4. **Iterate:** Refine UI/UX based on feedback
5. **Scale:** Expand to 5 concurrent students
6. **Deploy:** Roll out to production with gradual adoption

---

## Appendix A: Alternative Solutions Considered

### Cloud-Based Whiteboard Services
- **Miro:** Great UI but expensive ($8/user/month), overkill for simple canvas
- **Google Jamboard:** Being discontinued in 2024
- **Microsoft Whiteboard:** Limited API access, not suitable for LMS integration

### Video Conferencing Alternatives
- **Zoom:** Better API for meeting creation, but similar limitations on screen monitoring
- **Jitsi:** Open-source, self-hosted, but requires significant infrastructure setup
- **Agora:** Real-time video SDK, but expensive for education use case

### Recommendation
Stick with **hybrid approach**: Teams (or Zoom) for video + custom WebSocket canvas for monitoring.

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Author:** AI Development Team  
**Status:** Ready for Implementation Planning
