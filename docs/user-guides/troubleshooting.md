# LMS Troubleshooting Guide

## Quick Links
- **[Missing CSS/Assets (404 Errors)](../troubleshooting/missing-css-assets.md)** - Comprehensive guide for when CSS/JS files return 404

## Missing CSS and Static Assets (404 Errors) ⚠️ COMMON ISSUE

### Symptoms
- Page loads but appears completely unstyled (no CSS)
- Browser console shows **404 errors** for CSS, JS, and font files
- Errors like: `/_next/static/chunks/*.css` not found
- Login may not work due to missing JavaScript

### Cause
**PM2 was not restarted after running `npm run build`**. PM2 is serving an old build while the HTML references new file hashes.

### Quick Fix
```bash
# FASTEST: Just restart PM2
pm2 restart lms-nextjs

# Or use the automated fix script
./scripts/fix-missing-assets.sh

# Or use the full deployment script
./scripts/build-and-deploy.sh
```

### Verification
1. Clear browser cache or use incognito mode
2. Check browser console - should see **NO 404 errors**
3. Page should load with full styling

### Prevention
**NEVER run `npm run build` alone in production!** Always use:
```bash
./scripts/build-and-deploy.sh
```

📖 **Detailed Guide**: See [docs/troubleshooting/missing-css-assets.md](../troubleshooting/missing-css-assets.md) for complete troubleshooting steps.

---

## CSS Not Applied / Unstyled Content (Tailwind v4 Issue)

### Symptoms
- Page loads but appears unstyled
- No background colors, spacing, or formatting
- Plain HTML text only
- **No 404 errors in console** (different from above issue)

### Cause
Tailwind CSS v4 compatibility issue with Next.js 16 causing incomplete CSS generation (CSS file too small).

### Solution
1. Verify Tailwind version:
   ```bash
   npm list tailwindcss
   ```
   Should show: `tailwindcss@3.x.x`

2. If v4, downgrade:
   ```bash
   npm uninstall tailwindcss @tailwindcss/postcss
   npm install -D tailwindcss@3 postcss autoprefixer
   ```

3. Update `postcss.config.mjs`:
   ```javascript
   const config = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   };
   ```

4. Clean rebuild:
   ```bash
   rm -rf .next && npm run build
   pm2 restart lms-nextjs
   ```

5. Purge CloudFlare cache

## Login Fails with "Server Error" / UntrustedHost Error

### Symptoms
- Cannot login to the application
- Error page shows "Server error" or "There is a problem with the server configuration"
- Browser console shows HTTP 500 error on `/api/auth/error`
- PM2 logs show: `[auth][error] UntrustedHost: Host must be trusted`

### Cause
NextAuth.js v5 security requirement - the production domain must be explicitly trusted.

### Solution
Add `AUTH_TRUST_HOST=true` to `.env.production`:

```bash
echo 'AUTH_TRUST_HOST=true' >> .env.production
pm2 restart lms-nextjs --update-env
```

### Verification
1. Check logs for the error:
   ```bash
   pm2 logs lms-nextjs --lines 20 | grep UntrustedHost
   ```
   Should return no results if fixed.

2. Test auth endpoint:
   ```bash
   curl http://localhost:3001/api/auth/providers
   ```
   Should return JSON with provider information.

3. Try logging in again through the browser.

## Site Not Accessible (404)

### Check CloudFlare Tunnel
```bash
sudo systemctl status cloudflared
ps aux | grep cloudflared
```

### Check Nginx
```bash
sudo systemctl status nginx
curl -H "Host: lms.gagneet.com" http://localhost:80
```

### Check Application
```bash
pm2 status lms-nextjs
curl http://localhost:3001/api/health
```

## Site Returns 502 Error

### Cause
CloudFlare tunnel configured with `https://localhost:80` instead of `http://localhost:80`

### Solution
1. Go to CloudFlare Zero Trust dashboard
2. Networks → Tunnels → home-server → Configure
3. Edit public hostname for lms.gagneet.com
4. Change service URL from `https://` to `http://localhost:80`

## Database Connection Issues

### Check Connection
```bash
psql -h localhost -U lms_user -d lms_production
```

### Verify Environment
```bash
grep DATABASE_URL .env.production
```

### Test with Prisma
```bash
npx prisma db pull
```

## PM2 Not Starting

### Check Logs
```bash
pm2 logs lms-nextjs --lines 100
```

### Restart with Force
```bash
pm2 delete lms-nextjs
pm2 start ecosystem.config.cjs --env production
pm2 save
```

## Build Failures

### Clean Build
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Check Node Version
```bash
node -v  # Should be 18+
```

## CloudFlare Cache Issues

### Purge All Cache
1. CloudFlare Dashboard
2. Caching → Configuration
3. Purge Everything

### Development Mode
Enable to bypass cache during testing:
1. CloudFlare Dashboard
2. Caching → Configuration
3. Development Mode: ON (lasts 3 hours)

## Nginx Configuration

### Test Configuration
```bash
sudo nginx -t
```

### Reload Nginx
```bash
sudo systemctl reload nginx
```

### Check Logs
```bash
tail -f /var/log/nginx/lms_error.log
tail -f /var/log/nginx/lms_access.log
```

## Health Check Failures

### Manual Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "...",
  "uptime": 123
}
```

### Check Database
```bash
psql -h localhost -U lms_user -d lms_production -c "SELECT 1"
```

## Common Deployment Issues

### Issue: Old Code Running
**Solution**:
```bash
pm2 restart lms-nextjs --update-env
```

### Issue: Environment Variables Not Loading
**Solution**:
```bash
pm2 restart ecosystem.config.cjs --env production
pm2 save
```

### Issue: Port Already in Use
**Solution**:
```bash
sudo lsof -i :3001
pm2 delete lms-nextjs
pm2 start ecosystem.config.cjs --env production
```

## Getting Help

### Collect Diagnostic Info
```bash
# System info
node -v
npm -v
pm2 -v

# Application status
pm2 status
pm2 logs lms-nextjs --lines 50

# Service status
sudo systemctl status nginx
sudo systemctl status cloudflared

# Recent errors
tail -100 /var/log/nginx/lms_error.log
```

### Enable Verbose Logging
Edit `ecosystem.config.cjs`:
```javascript
env_production: {
  NODE_ENV: 'production',
  PORT: 3001,
  DEBUG: 'lms:*',  // Add this
}
```

Restart: `pm2 restart lms-nextjs --update-env`

## Emergency Rollback

If deployment is broken:
```bash
# List available backups
./scripts/rollback.sh

# Rollback to latest
./scripts/rollback.sh latest

# Rollback to specific backup
./scripts/rollback.sh backup-20260211-050000
```

## Preventing Issues

### Before Deployment
- [ ] Test in development mode first
- [ ] Verify all tests pass
- [ ] Check for Tailwind v3 (not v4)
- [ ] Review environment variables

### After Deployment
- [ ] Run health check
- [ ] Test in browser
- [ ] Check PM2 logs
- [ ] Verify database connectivity
- [ ] Purge CloudFlare cache

### Regular Maintenance
- [ ] Monitor PM2 logs daily
- [ ] Check disk space weekly
- [ ] Review error logs weekly
- [ ] Update dependencies monthly (carefully!)
- [ ] Test rollback procedure quarterly
