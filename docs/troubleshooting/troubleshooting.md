# Troubleshooting Guide

This document contains solutions to common issues encountered in the LMS application.

## Table of Contents
- [Authentication & Redirects](#authentication--redirects)
- [PM2 & Deployment](#pm2--deployment)
- [Database Issues](#database-issues)
- [CSS & Styling](#css--styling)

---

## Authentication & Redirects

### Issue: Application Redirects to Wrong Domain

**Symptoms:**
- Visiting `https://lms.gagneet.com` redirects to `http://local:3001` or another incorrect URL
- NextAuth callbacks redirect to wrong domain
- Authentication fails after login

**Root Cause:**
PM2 does not automatically load `.env` or `.env.production` files. If critical environment variables like `NEXTAUTH_URL` are not explicitly defined in `ecosystem.config.cjs`, PM2 may inherit environment variables from the system environment, causing incorrect URLs.

**Solution:**

1. **Verify the issue** - Check what environment variables PM2 is actually using:
   ```bash
   pm2 jlist | jq '.[0].pm2_env.env.NEXTAUTH_URL'
   ```

2. **Fix ecosystem.config.cjs** - Ensure all critical environment variables are explicitly defined:
   ```javascript
   env_production: {
     NODE_ENV: 'production',
     PORT: 3001,
     NEXT_TELEMETRY_DISABLED: 1,
     DATABASE_URL: 'postgresql://lms_user:PASSWORD@localhost:5432/lms_production?schema=public',
     NEXTAUTH_URL: 'https://lms.gagneet.com',  // Must match public URL exactly
     NEXTAUTH_SECRET: 'your_secret_here',
     AUTH_TRUST_HOST: 'true',  // Required for NextAuth v5
   }
   ```

3. **Restart PM2** with the updated configuration:
   ```bash
   pm2 delete lms-nextjs
   pm2 start ecosystem.config.cjs --env production
   pm2 save
   ```

4. **Verify the fix**:
   ```bash
   pm2 jlist | jq '.[0].pm2_env.env.NEXTAUTH_URL'
   # Should output: "https://lms.gagneet.com"
   ```

**Prevention:**
- Always define critical environment variables in `ecosystem.config.cjs` under `env_production`
- Never rely on `.env` files being loaded by PM2
- Document all required environment variables in the PM2 config

**Related Issues:**
- Session cookies not working across domains
- CSRF token errors
- Infinite redirect loops

### Issue: Redirect to localhost:3001 with CloudFlare Tunnel

**Symptoms:**
- Accessing `https://lms.gagneet.com` redirects to `http://localhost:3001`
- Next.js middleware forcing HTTPS redirect with wrong hostname

**Root Cause:**
When using CloudFlare Tunnel, CloudFlare terminates SSL and forwards HTTP traffic to Nginx on port 80. If Nginx sets `X-Forwarded-Proto: $scheme` (which equals `http`), the Next.js middleware detects non-HTTPS traffic and triggers a redirect, but uses the backend hostname instead of the public URL.

**Solution:**

1. **Update Nginx configuration** to always send `https` as the forwarded protocol:
   ```bash
   sudo sed -i 's/proxy_set_header X-Forwarded-Proto \$scheme;/proxy_set_header X-Forwarded-Proto https;/g' /etc/nginx/sites-available/lms
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Verify the change:**
   ```bash
   grep "X-Forwarded-Proto" /etc/nginx/sites-available/lms
   # Should show: proxy_set_header X-Forwarded-Proto https;
   ```

3. **Test the fix:**
   ```bash
   curl -I http://localhost:3001/login -H "X-Forwarded-Proto: https" -H "Host: lms.gagneet.com"
   # Should return 200 OK, not 307 redirect
   ```

**Why this works:**
- CloudFlare Tunnel handles SSL termination
- Connection between CloudFlare and Nginx is HTTP (secure tunnel)
- Setting `X-Forwarded-Proto: https` tells Next.js the original request was HTTPS
- Next.js middleware skips the HTTPS redirect when it sees the header

**Prevention:**
- When using CloudFlare Tunnel or any SSL-terminating proxy, configure Nginx to send `X-Forwarded-Proto: https`
- Document proxy architecture in deployment notes
- Test with proper forwarded headers during development

---

## PM2 & Deployment

### Issue: Environment Variables Not Loading After Restart

**Symptoms:**
- `pm2 restart lms-nextjs` doesn't pick up new environment variables
- `pm2 restart --update-env` doesn't work as expected

**Solution:**
PM2 caches environment variables. To force reload:
```bash
pm2 delete lms-nextjs
pm2 start ecosystem.config.cjs --env production
pm2 save
```

### Issue: PM2 Process Keeps Crashing

**Check logs:**
```bash
pm2 logs lms-nextjs --lines 50
```

**Common causes:**
1. Database connection issues - verify `DATABASE_URL`
2. Port already in use - check if port 3001 is available
3. Memory issues - check `max_memory_restart` setting
4. Missing dependencies - run `npm install`

---

## Database Issues

### Issue: Prisma Client Not Generated

**Symptoms:**
- Import errors: `Cannot find module '@prisma/client'`
- TypeScript errors about Prisma types

**Solution:**
```bash
npm run db:generate
npm run build
pm2 restart lms-nextjs
```

### Issue: Database Connection Refused

**Check PostgreSQL status:**
```bash
sudo systemctl status postgresql
```

**Verify connection:**
```bash
psql -U lms_user -d lms_production -h localhost
```

**Check DATABASE_URL:**
- Ensure it's correctly set in `ecosystem.config.cjs`
- Verify username, password, database name, and host

---

## CSS & Styling

### Issue: CSS Not Loading After Deployment

**Symptoms:**
- Styles work in development but not in production
- CSS file is only ~5KB instead of ~21KB
- Missing utility classes like `text-5xl`, `from-blue-50`, etc.

**Root Cause:**
Tailwind CSS v4 has compatibility issues with Next.js 16.

**Solution:**

1. **Ensure Tailwind v3 is installed:**
   ```bash
   npm list tailwindcss
   # Should show: tailwindcss@3.x.x
   ```

2. **Check PostCSS config** (`postcss.config.mjs`):
   ```javascript
   export default {
     plugins: {
       tailwindcss: {},  // NOT @tailwindcss/postcss
       autoprefixer: {},
     },
   };
   ```

3. **Clean rebuild:**
   ```bash
   rm -rf .next
   npm run build
   pm2 restart lms-nextjs
   ```

4. **Purge CloudFlare cache** (if using CloudFlare):
   - Go to CloudFlare Dashboard
   - Navigate to Caching → Configuration
   - Click "Purge Everything"

**Prevention:**
- Do NOT upgrade to Tailwind CSS v4 until Next.js compatibility is confirmed
- Always verify CSS file size after build (should be ~21KB for this project)
- Test in production-like environment before deploying

---

## General Debugging Tips

### Check Application Health
```bash
curl http://localhost:3001/api/health
# or
./scripts/health-check.sh
```

### View Logs
```bash
# PM2 logs
pm2 logs lms-nextjs --lines 100

# Specific log files
tail -f logs/pm2-error.log
tail -f logs/pm2-out.log
```

### Monitor Resources
```bash
pm2 monit
```

### Database GUI
```bash
npx prisma studio
# Opens at http://localhost:5555
```

---

## Getting Help

If none of these solutions work:

1. Check recent commits for breaking changes
2. Review the deployment logs in `logs/` directory
3. Verify all environment variables are correctly set
4. Consider using the rollback script: `./scripts/rollback.sh`
5. Check the main documentation in `CLAUDE.md`

## Contributing

If you encounter a new issue and find a solution, please add it to this document following the existing format.
