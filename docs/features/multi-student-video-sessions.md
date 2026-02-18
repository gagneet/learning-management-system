# Multi-Student Video Session Feature

## Overview

The Multi-Student Video Session feature provides an in-built video conferencing solution for school-based classes where a single tutor can teach multiple students simultaneously. Each student can be working on different courses and exercises at different levels.

## Feature Highlights

### Two-Panel Layout

**LEFT PANEL - Video Screens:**
- Embedded Daily.co video conferencing
- Displays all participants (tutor + students) in a grid
- Real-time video and audio streams
- Video controls (camera on/off, mute/unmute, leave session)
- Participant count display

**RIGHT PANEL - Student Information Columns:**
- Horizontal scrollable columns (one per student)
- Each column shows:
  - Student name and grade level
  - Current course title
  - Session time (time in current session)
  - Total time (cumulative interaction time)
  - Status indicator (working, waiting for help, completed, idle)
  - Teach/Observe mode toggle (tutor only)
  - Current exercise with progress bar
  - Quick action buttons (Assign, Message)

## Setup Instructions

### 1. Daily.co Account Setup

**Create account:** https://dashboard.daily.co/signup (free 1000 min/month)

**Configure environment variables:**
```bash
# Add to .env or .env.production
DAILY_API_KEY=your_api_key_here
DAILY_DOMAIN=your-domain.daily.co
```

### 2. Database Setup

```bash
npm run db:generate
npm run db:push
```

### 3. Access the Feature

**For Tutors:**
- Navigate to `/dashboard/tutor/sessions/[sessionId]/video`
- Video room auto-creates on first access

**For Students:**
- Navigate to `/dashboard/student/sessions/[sessionId]/video`  
- Join with one click

## Usage Guide

### Tutor Workflow

1. **Start Session:** Click "Start Session" or navigate to video page
2. **Manage Students:** View videos (left) and student info (right)
3. **Toggle Modes:** Switch between Teach (active) and Observe (passive)
4. **Monitor Progress:** Track exercise completion in real-time
5. **Record Session:** Start/stop recording with one click

### Student Workflow

1. **Join Session:** Click join link from tutor
2. **Enable Camera/Mic:** Allow browser permissions
3. **Work on Exercises:** Complete assigned exercises
4. **Request Help:** Click help button when needed

## API Endpoints

```
POST   /api/sessions/[id]/video/create    - Create video room
GET    /api/sessions/[id]/video/token     - Get join token
POST   /api/sessions/[id]/video/recording - Start recording
DELETE /api/sessions/[id]/video/recording - Stop recording
GET    /api/sessions/[id]/video/recording - List recordings
```

## Security

- Time-limited tokens (2-hour expiry)
- Private rooms (token-required access)
- RBAC enforcement (tutor, student, admin roles)
- Multi-tenancy isolation
- Audit logging for all video access

## Performance

**Bandwidth:** 1.5 Mbps minimum per participant  
**Recommended:** 3 Mbps for best quality  
**Max Participants:** 10 default (200 max with upgrade)

## Cost

**Daily.co Free Tier:** 1000 minutes/month  
**Starter Plan:** $99/month (10,000 minutes)  
**Example:** 80 sessions/month × 6 participants × 60 min = ~$285/month

## Troubleshooting

**Video not loading:**
- Check DAILY_API_KEY configured
- Verify browser permissions
- Try Chrome or Firefox

**Token errors:**
- Regenerate token (expires after 2 hours)
- Check user is enrolled in session

**Performance issues:**
- Check network bandwidth (min 1.5 Mbps)
- Reduce participants or lower quality

## For Full Documentation

See `/docs/gap-analysis/video-conferencing-implementation-plan.md` for complete architecture details and implementation guide.
