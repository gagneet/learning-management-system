# Troubleshooting: Missing CSS and Static Assets (404 Errors)

**Last Updated**: February 12, 2026

## Problem Description

After running `npm run build`, the website loads without CSS styling and the browser console shows multiple 404 errors for:
- CSS files (e.g., `/_next/static/chunks/*.css`)
- JavaScript chunks (e.g., `/_next/static/chunks/*.js`)
- Font files (e.g., `/_next/static/media/*.woff2`)

**Symptoms:**
- Home page and login page appear unstyled
- Browser console shows 404 errors for static assets
- Application appears "broken" but the server responds
- PM2 shows application as "online" but serving old build

## Root Cause

This issue occurs when **PM2 is not restarted after a new build**. The sequence of events:

1. ✅ Build completes successfully (`npm run build`)
2. ✅ New `.next` directory created with new BUILD_ID and chunk hashes
3. ❌ PM2 is still running with the OLD build in memory
4. ❌ HTML references NEW chunk hashes (from new build)
5. ❌ PM2 serves OLD chunk hashes (from old build in memory)
6. ❌ Browser gets 404 errors for mismatched files

**Key Concept**: Next.js generates unique hashes for each build. PM2 caches the old build in memory, so it serves files with old hashes while the HTML references new hashes.

## Quick Fix (Immediate Resolution)

```bash
# Restart PM2 to load the new build
pm2 restart lms-nextjs

# Verify health
curl http://localhost:3001/api/health

# Check that PM2 is serving the correct build
pm2 logs lms-nextjs --lines 20
```

The issue should be resolved immediately after restarting PM2.

## Proper Deployment Procedure

**Always use the automated deployment script:**

```bash
./scripts/build-and-deploy.sh
```

This script ensures:
1. ✅ Previous build is cleaned
2. ✅ Dependencies are installed
3. ✅ Prisma client is generated
4. ✅ Application is built
5. ✅ PM2 is restarted automatically
6. ✅ Health checks are performed
7. ✅ Automatic rollback on failure

**DO NOT** run `npm run build` alone in production. If you do, you MUST restart PM2:

```bash
npm run build && pm2 restart lms-nextjs
```

## Complete Cleanup and Rebuild

If the issue persists or you want to ensure a completely clean build:

```bash
# Step 1: Clean all build artifacts and caches
./scripts/clean-build.sh

# Step 2: Deploy with automated script
./scripts/build-and-deploy.sh
```

The `clean-build.sh` script removes:
- `.next` directory (build output)
- `node_modules/.cache` (package caches)
- PM2 logs
- Prisma engine cache
- Next.js cache

## Manual Cleanup Steps

If automated scripts are not available:

```bash
# 1. Stop PM2
pm2 stop lms-nextjs

# 2. Clean build artifacts
rm -rf .next
rm -rf node_modules/.cache

# 3. Rebuild
npm run build

# 4. Restart PM2
pm2 restart lms-nextjs

# 5. Verify
curl http://localhost:3001/api/health
```

## Verification Checklist

After deployment, verify the following:

### 1. Build Artifacts Exist
```bash
# Check BUILD_ID exists
cat .next/BUILD_ID

# Check CSS files exist (should be ~35KB)
ls -lh .next/static/chunks/*.css

# Check JavaScript chunks exist
ls -lh .next/static/chunks/*.js
```

### 2. PM2 is Running Correctly
```bash
# Check PM2 status
pm2 list

# Look for lms-nextjs with status "online"
# Note the uptime - it should be recent (< 5 minutes after build)

# Check PM2 logs for errors
pm2 logs lms-nextjs --lines 50 --nostream
```

### 3. Health Check Passes
```bash
# Local health check
curl http://localhost:3001/api/health | jq '.'

# Should return:
# {
#   "status": "healthy",
#   "database": "connected",
#   "uptime": <recent>,
#   ...
# }
```

### 4. Browser Verification
- Open browser in **incognito/private mode** (to avoid cache)
- Navigate to https://lms.gagneet.com
- Open Developer Tools (F12) → Console
- Refresh page (Ctrl+Shift+R for hard refresh)
- **Should see NO 404 errors** for CSS/JS/fonts

### 5. CloudFlare Cache
If the issue persists after PM2 restart:

```bash
# Option 1: Purge via CloudFlare Dashboard
# - Login to CloudFlare
# - Go to Caching → Configuration
# - Click "Purge Everything"

# Option 2: Wait for cache to expire (1 hour default)
```

## Prevention: Best Practices

### 1. Always Use Automated Scripts

```bash
# For deployment
./scripts/build-and-deploy.sh

# For cleanup
./scripts/clean-build.sh
```

### 2. Never Run `npm run build` Alone

If you must build manually:
```bash
# WRONG (will cause this issue)
npm run build

# CORRECT (restart PM2 afterwards)
npm run build && pm2 restart lms-nextjs
```

### 3. Verify After Every Deployment

```bash
# Quick verification
./scripts/health-check.sh --verbose

# Or manual check
curl http://localhost:3001/api/health
pm2 logs lms-nextjs --lines 20
```

### 4. Monitor PM2 Uptime

```bash
# Check when PM2 was last restarted
pm2 list

# Compare uptime to build time
ls -lh .next/BUILD_ID

# Uptime should be < build time
```

## Common Scenarios

### Scenario 1: After Git Pull + Build
```bash
# User does:
git pull
npm run build

# Problem: PM2 not restarted

# Solution:
pm2 restart lms-nextjs
```

### Scenario 2: Multiple Builds in Quick Succession
```bash
# User does:
npm run build    # Build 1
npm run build    # Build 2
npm run build    # Build 3

# Problem: PM2 still on Build 1

# Solution:
pm2 restart lms-nextjs  # Load Build 3
```

### Scenario 3: PM2 Auto-Restart After Crash
```bash
# If PM2 auto-restarts due to crash, it loads the LATEST build from .next
# This should work correctly

# However, if you built AFTER the crash but BEFORE PM2 restart:
# - PM2 loads old build from before crash
# - Solution: Manually restart PM2 after build
pm2 restart lms-nextjs
```

## Debug Information

### Check Current Build ID
```bash
# In .next directory
cat .next/BUILD_ID
# Example output: 02VBGBLIt4MwHWe6HoE9F

# This is the BUILD_ID that Next.js generated
# PM2 should be serving files under /_next/static/{BUILD_ID}/
```

### Check PM2 Memory
```bash
# Check if PM2 has the build in memory
pm2 describe lms-nextjs

# Look for:
# - status: online (good)
# - restart_time: should be after build time
# - uptime: should be recent
```

### Check Network Requests
```bash
# From browser console, copy a failed request URL
# Example: https://lms.gagneet.com/_next/static/chunks/77389065e59c6185.css

# Check if file exists on disk
ls -lh .next/static/chunks/77389065e59c6185.css

# If file exists but returns 404, PM2 is serving old build
```

## Related Issues

### Issue: Fonts Not Loading (404)
- **Cause**: Same as CSS/JS - PM2 not restarted
- **Solution**: Restart PM2

### Issue: CSS Incomplete (Partial Styling)
- **Cause**: Tailwind CSS not compiling correctly (different issue)
- **Solution**: See `docs/deployment-notes.md` for Tailwind v3 vs v4 issues

### Issue: Login Not Working After Build
- **Cause**: NextAuth session mismatch or JS chunks not loading
- **Solution**: Restart PM2, clear browser cache, try incognito mode

## Emergency Recovery

If the application is completely broken:

```bash
# 1. Check if backups exist
ls -lh backups/

# 2. Rollback to last working version
./scripts/rollback.sh latest

# 3. If rollback fails, manually restart with clean build
./scripts/clean-build.sh
./scripts/build-and-deploy.sh
```

## Automation Recommendations

### Pre-Push Git Hook
Create `.git/hooks/pre-push`:
```bash
#!/bin/bash
echo "Reminder: After deploying on server, run:"
echo "  ./scripts/build-and-deploy.sh"
echo "NOT just 'npm run build'"
```

### PM2 Watch Mode (Not Recommended for Production)
```bash
# DO NOT USE in production
# PM2 watch mode can cause issues with Next.js
pm2 start ecosystem.config.cjs --watch  # AVOID
```

## Summary

| Cause | Solution | Prevention |
|-------|----------|------------|
| PM2 not restarted after build | `pm2 restart lms-nextjs` | Use `./scripts/build-and-deploy.sh` |
| Manual `npm run build` | Always restart PM2 after | Use automated scripts |
| Stale cache | Clear `.next` before build | Use `./scripts/clean-build.sh` |
| CloudFlare cache | Purge CloudFlare cache | Wait 1 hour or purge manually |

## Support

For additional help:
- Check PM2 logs: `pm2 logs lms-nextjs`
- Check build logs: `npm run build > build.log 2>&1`
- Contact DevOps team with:
  - Browser console errors (screenshot)
  - PM2 logs output
  - Output of `pm2 list`
  - Output of `ls -lh .next/static/chunks/`

---

**Document Version**: 1.0
**Last Updated**: 2026-02-12
**Related Documents**:
- `docs/deployment-production.md` - Production deployment guide
- `docs/deployment-notes.md` - Tailwind CSS and build notes
- `scripts/build-and-deploy.sh` - Automated deployment script
- `scripts/clean-build.sh` - Cleanup script
