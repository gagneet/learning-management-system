# Nginx Configuration Fix for CloudFlare Tunnel

**Date:** February 13, 2026
**Issue:** Application redirecting to `http://localhost:3001` when accessed via `https://lms.gagneet.com`

## Problem Analysis

### Architecture
```
User Browser → CloudFlare (HTTPS) → CloudFlare Tunnel → Nginx (HTTP:80) → Next.js (HTTP:3001)
```

### Root Cause
1. CloudFlare terminates SSL and forwards traffic to Nginx via HTTP (secure tunnel)
2. Nginx was configured with `proxy_set_header X-Forwarded-Proto $scheme;`
3. Since Nginx receives HTTP, `$scheme` equals `http`
4. Next.js middleware checks `x-forwarded-proto` header
5. Middleware sees `http` and triggers HTTPS redirect
6. Redirect uses local hostname (`localhost:3001`) instead of public URL

## Solution Implemented

### Changes Made

**File:** `/etc/nginx/sites-available/lms`
**Change:** Updated all instances of:
```nginx
# Before
proxy_set_header X-Forwarded-Proto $scheme;

# After
proxy_set_header X-Forwarded-Proto https;
```

### Why This Works
- CloudFlare Tunnel is a secure encrypted tunnel
- Even though the connection between CloudFlare and Nginx uses HTTP, it's within a secure tunnel
- By setting `X-Forwarded-Proto: https`, we tell Next.js the original request from the browser was HTTPS
- Next.js middleware skips the redirect when it sees the request is already HTTPS
- Application maintains the correct public hostname throughout the request

### Commands Executed
```bash
# Update configuration
sudo sed -i 's/proxy_set_header X-Forwarded-Proto \$scheme;/proxy_set_header X-Forwarded-Proto https;/g' /etc/nginx/sites-available/lms

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Testing

### Test Cases

1. **Direct localhost test (should redirect):**
   ```bash
   curl -I http://localhost:3001/login
   # Expected: 307 redirect to https://localhost:3001/login
   ```

2. **With CloudFlare headers (should NOT redirect):**
   ```bash
   curl -I http://localhost:3001/login \
     -H "X-Forwarded-Proto: https" \
     -H "Host: lms.gagneet.com"
   # Expected: 200 OK
   ```

3. **Public URL (should work correctly):**
   ```bash
   curl -I https://lms.gagneet.com
   # Expected: 200 OK
   ```

## Related Issues Resolved

1. ✅ Authentication redirects working correctly
2. ✅ Session persistence across requests
3. ✅ NextAuth callbacks using correct URLs
4. ✅ No more localhost:3001 references in production

## Lessons Learned

### For CloudFlare Tunnel Deployments
- CloudFlare Tunnel uses a secure encrypted connection
- Traffic between CloudFlare and origin is HTTP within the tunnel
- Nginx must be configured to send `X-Forwarded-Proto: https`
- Never use `$scheme` when behind CloudFlare Tunnel

### For Next.js Middleware
- Middleware runs on every request and can cause redirect loops
- Always check `x-forwarded-proto` header in production
- Be careful with URL construction in redirects
- Consider the full request path: Browser → CDN → Proxy → App

### For PM2 Environment Variables
- PM2 does NOT load `.env` files automatically
- All environment variables must be in `ecosystem.config.cjs`
- Critical variables: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AUTH_TRUST_HOST`, `DATABASE_URL`
- After config changes: `pm2 delete app && pm2 start ecosystem.config.cjs --env production && pm2 save`

## Prevention

### Deployment Checklist
- [ ] Verify Nginx `X-Forwarded-Proto` is set to `https` (not `$scheme`)
- [ ] Check PM2 environment variables are in `ecosystem.config.cjs`
- [ ] Test with proper forwarded headers before going live
- [ ] Document proxy architecture (SSL termination points)
- [ ] Verify `NEXTAUTH_URL` matches public domain exactly

### Configuration Template
```nginx
# Correct configuration for CloudFlare Tunnel
location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;  # Always https for CloudFlare Tunnel
}
```

## Additional Notes

### Health Check Implications
- Health checks directly to localhost will still get redirects (expected)
- Health checks should either:
  1. Use the public URL: `https://lms.gagneet.com/api/health`
  2. Include proper headers: `-H "X-Forwarded-Proto: https" -H "Host: lms.gagneet.com"`
  3. Bypass middleware for health endpoint

### Monitoring
- Monitor Nginx logs for redirect patterns
- Check PM2 logs for NextAuth errors
- Verify session persistence in production

## References

- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- NextAuth.js Configuration: https://next-auth.js.org/configuration/options
- CloudFlare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Nginx Proxy Headers: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
