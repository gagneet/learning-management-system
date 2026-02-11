# CloudFlare Tunnel Configuration for LMS

## Current Status

✅ DNS is configured: lms.gagneet.com → CloudFlare IPs
✅ Application is running: localhost:3001
✅ Nginx is configured: localhost:80 → localhost:3001
❌ Tunnel routing: Not configured (returns 404)

## Why Local Config Doesn't Work

Your CloudFlare Tunnel is using **remote configuration** from the CloudFlare dashboard (version=14). This overrides local config file changes. You need to add the route in the CloudFlare dashboard.

## Steps to Complete Configuration

### Option 1: Add Route in CloudFlare Dashboard (Recommended)

1. **Log in to CloudFlare Dashboard**
   - Go to https://dash.cloudflare.com
   - Select your account
   - Go to "Zero Trust" (in the left sidebar)

2. **Navigate to Tunnel Configuration**
   - Click "Networks" → "Tunnels"
   - Find your tunnel (ID: c66da87e-6ce4-4242-afea-8a8b3162b235)
   - Click "Configure"

3. **Add Public Hostname**
   - Go to "Public Hostnames" tab
   - Click "Add a public hostname"
   - Configure:
     ```
     Subdomain: lms
     Domain: gagneet.com
     Type: HTTP
     URL: localhost:80
     ```
   - Click "Save hostname"

4. **Verify**
   - Wait 30-60 seconds for changes to propagate
   - Test: curl https://lms.gagneet.com/api/health
   - Should return: {"status":"healthy",...}

### Option 2: Disable Remote Configuration (Alternative)

If you prefer to use local configuration:

1. In CloudFlare dashboard, go to your tunnel settings
2. Disable "Remotely managed configuration"
3. The tunnel will then use /etc/cloudflared/config.yml
4. Restart cloudflared:
   ```bash
   sudo systemctl restart cloudflared
   ```

### Option 3: Use CloudFlare CLI (Advanced)

```bash
# List current routes
cloudflared tunnel route dns list

# Add DNS route for LMS
cloudflared tunnel route dns c66da87e-6ce4-4242-afea-8a8b3162b235 lms.gagneet.com
```

## Verification

Once configured, test with:

```bash
# Test health endpoint
curl https://lms.gagneet.com/api/health

# Expected response:
# {"status":"healthy","database":"connected",...}

# Test login page
curl -I https://lms.gagneet.com/login

# Expected: HTTP/2 200
```

## Current Tunnel Configuration

**Tunnel ID**: c66da87e-6ce4-4242-afea-8a8b3162b235
**Config File**: /etc/cloudflared/config.yml (not being used)
**Management**: Remote (CloudFlare Dashboard)
**Status**: Active with 4 connections

**Currently Configured Routes** (remote):
- eastgateresidences.com.au
- www.eastgateresidences.com.au
- mail.eastgateresidences.com.au
- eastgate.gagneet.com
- healthapp.gagneet.com
- retirement.gagneet.com
- hamees.gagneet.com
- skillsapien.com
- www.skillsapien.com

**Missing**: lms.gagneet.com (needs to be added)

## Troubleshooting

### Still getting 404 after adding route?
- Wait 60 seconds for CloudFlare edge to update
- Clear browser cache
- Try incognito/private mode
- Check tunnel status: `sudo systemctl status cloudflared`

### Route not appearing in dashboard?
- Make sure you're in the correct CloudFlare account
- Check you're editing the right tunnel (ID: c66da87e-6ce4-4242-afea-8a8b3162b235)
- Try refreshing the page

### Want to switch to local config?
- Disable remote management in dashboard
- Update /etc/cloudflared/config.yml (already done)
- Restart: `sudo systemctl restart cloudflared`
- Verify with: `cloudflared tunnel ingress rule https://lms.gagneet.com`

## Summary

The LMS application is **fully deployed and running locally**. The only remaining step is to add the public hostname route in the CloudFlare dashboard to make it accessible at https://lms.gagneet.com.

**Quick Action**: Add public hostname in CloudFlare Zero Trust dashboard:
- Subdomain: `lms`
- Domain: `gagneet.com` 
- Service: `HTTP`
- URL: `localhost:80`

---

**Need Help?**
- CloudFlare Tunnel Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Zero Trust Dashboard: https://dash.cloudflare.com → Zero Trust → Networks → Tunnels
