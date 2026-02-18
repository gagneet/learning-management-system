# Multi-Student Video Sessions - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Daily.co account (free tier: https://dashboard.daily.co/signup)

### Step 1: Install Dependencies

Already done if you've cloned the repo:
```bash
npm install
```

The following packages are now included:
- `@daily-co/daily-js` - Daily.co JavaScript SDK
- `@daily-co/daily-react` - Daily.co React hooks

### Step 2: Configure Daily.co

1. **Create Daily.co account:**
   - Go to https://dashboard.daily.co/signup
   - Sign up (free: 1000 minutes/month)

2. **Get your API credentials:**
   - Login to Daily.co dashboard
   - Go to "Developers" section
   - Copy your **API Key**
   - Note your **Domain** (e.g., `your-domain.daily.co`)

3. **Add to environment file:**
   ```bash
   # Copy example file
   cp .env.example .env
   
   # Edit .env and add:
   DAILY_API_KEY=your_api_key_here
   DAILY_DOMAIN=your-domain.daily.co
   ```

### Step 3: Update Database Schema

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push
```

This adds:
- `VideoParticipant` model
- `VideoRecording` model  
- Video fields to `Session` model

### Step 4: Start Development Server

```bash
npm run dev
```

### Step 5: Test the Feature

1. **Login as a tutor:**
   - Email: `teacher@lms.com`
   - Password: `teacher123`

2. **Create or navigate to a session:**
   - Go to `/dashboard/tutor/sessions`
   - Click on any session
   - Click "Video Session" or navigate to `/dashboard/tutor/sessions/[sessionId]/video`

3. **The video page will:**
   - Auto-create a Daily.co room
   - Generate your access token
   - Load the video interface

4. **Test with multiple students:**
   - Open in incognito/another browser
   - Login as a student: `student@lms.com` / `student123`
   - Navigate to same session video page
   - Both users should see each other in the video grid

## 📱 Using the Feature

### Tutor View

**LEFT PANEL:** Video grid showing all participants  
**RIGHT PANEL:** Student columns with:
- Name and grade level
- Session timer (live updates)
- Status (working, needs help, etc.)
- Teach/Observe mode toggle
- Exercise progress
- Quick actions (Assign, Message)

### Student View

**Same layout:**
- See yourself and tutor in video grid
- Your info column shows your progress
- Simple interface focused on learning

## 🎯 Key Features

✅ **Embedded video** - No external links needed  
✅ **Real-time timers** - Track session and total time per student  
✅ **Teach/Observe modes** - Toggle instruction style per student  
✅ **Status indicators** - Color-coded student states  
✅ **Recording** - Built-in cloud recording (API ready, UI pending)  
✅ **Secure** - Token-based authentication, RBAC enforced  

## 🔧 Development Tips

### Debugging Video Issues

1. **Check Daily.co connection:**
   ```javascript
   // In browser console
   console.log(process.env.NEXT_PUBLIC_DAILY_API_KEY) // Should NOT be visible
   // API key is server-side only
   ```

2. **Enable Daily.co debug logs:**
   ```typescript
   // In MultiStudentVideoGrid.tsx
   callFrame.on('*', (event) => {
     console.log('Daily event:', event);
   });
   ```

3. **Check token generation:**
   ```bash
   # Test token API
   curl http://localhost:3000/api/sessions/[sessionId]/video/token \
     -H "Cookie: authjs.session-token=YOUR_SESSION"
   ```

### Testing Without Video

If you don't have a Daily.co account yet, the page will show an error. To develop the layout without video:

1. Comment out Daily.co initialization in `MultiStudentVideoGrid.tsx`
2. Mock the video container with a placeholder
3. Test student column layout and interactions

### Database Queries

Check video participants:
```sql
SELECT * FROM "VideoParticipant" 
WHERE "sessionId" = 'your-session-id';
```

Check recordings:
```sql
SELECT * FROM "VideoRecording" 
WHERE "sessionId" = 'your-session-id';
```

## 📊 Monitoring

### Key Metrics

Track these in production:
- Video connection success rate (target: >95%)
- Average join time (target: <5 seconds)
- Participant session duration
- Recording completion rate

### Daily.co Dashboard

Monitor usage:
- https://dashboard.daily.co/analytics
- Check minutes used
- View participant counts
- Download recordings

## 🐛 Common Issues

### Issue: "Video service not configured"

**Cause:** Missing Daily.co environment variables  
**Fix:** Add `DAILY_API_KEY` and `DAILY_DOMAIN` to `.env`

### Issue: "Failed to join video call"

**Causes:**
- Browser permissions denied (camera/mic)
- Invalid token (expired)
- Network firewall blocking WebRTC

**Fixes:**
- Check browser console for errors
- Allow camera/microphone in browser settings
- Try different browser (Chrome/Firefox recommended)
- Check network allows WebRTC (ports 3478, 19302)

### Issue: "No video room exists"

**Cause:** Tutor hasn't started session yet  
**Fix:** Tutor must access video page first to create room

### Issue: Token expired

**Cause:** Tokens expire after 2 hours  
**Fix:** Refresh the page to generate new token

## 🚢 Production Deployment

### Environment Variables

Add to production `.env`:
```bash
DAILY_API_KEY=prod_api_key_here
DAILY_DOMAIN=your-production-domain.daily.co
NEXTAUTH_URL=https://lms.gagneet.com
```

### Performance

- Daily.co handles all video infrastructure
- No server scaling needed for video
- Database writes only on join/leave (minimal load)

### Costs

**Free tier:** 1000 minutes/month  
**Typical usage:** 6 participants × 60 min × 80 sessions = 28,800 min/month  
**Recommended plan:** Starter ($99/month for 10,000 min) or Business ($299/month for 50,000 min)

## 📚 Next Steps

1. **Add recording UI:** Implement start/stop recording buttons
2. **Whiteboard integration:** Add collaborative drawing
3. **Screen sharing:** Allow tutors to share screen
4. **Chat:** In-session text messaging
5. **Analytics:** Session quality metrics

## 💬 Support

- **Documentation:** `/docs/gap-analysis/video-conferencing-implementation-plan.md`
- **Feature Guide:** `/docs/features/multi-student-video-sessions.md`
- **Daily.co Docs:** https://docs.daily.co/
- **GitHub Issues:** https://github.com/gagneet/learning-management-system/issues

## ✅ Checklist

- [ ] Daily.co account created
- [ ] Environment variables configured
- [ ] Database schema updated
- [ ] Development server running
- [ ] Tested with tutor account
- [ ] Tested with student account
- [ ] Video working in both browsers
- [ ] Student columns displaying correctly
- [ ] Timers updating in real-time

---

**Congratulations!** You now have a fully functional multi-student video session feature. 🎉

For full implementation details, see `/docs/gap-analysis/video-conferencing-implementation-plan.md`.
