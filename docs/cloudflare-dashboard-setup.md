# CloudFlare Dashboard - Add LMS Public Hostname

## Current Status

- Application: RUNNING (localhost:3001)
- Nginx: WORKING (localhost:80 -> localhost:3001)
- DNS: CONFIGURED (lms.gagneet.com -> CloudFlare)
- Tunnel: ACTIVE (home-server, 4 connections)
- Local Config: READY (rules configured)
- Remote Config: MISSING LMS ROUTE

## Quick Fix (2 Minutes)

1. Open: https://one.dash.cloudflare.com

2. Click: "Networks" (left sidebar)

3. Click: "Tunnels"

4. Find tunnel: "home-server"
   (ID: c66da87e-6ce4-4242-afea-8a8b3162b235)

5. Click: "Configure" button

6. Click: "Public Hostnames" tab

7. Click: "+ Add a public hostname" button

8. Fill in the form:

   | Field | Value |
   |-------|-------|
   | Subdomain | lms |
   | Domain | gagneet.com (from dropdown) |
   | Path | (leave empty) |
   | Service Type | HTTP |
   | Service URL | localhost:80 |

9. Click: "Save hostname"

10. DONE! Wait 30 seconds

## Verify

Test in terminal:
```bash
curl https://lms.gagneet.com/api/health
```

Expected:
```json
{"status":"healthy","database":"connected",...}
```

Open in browser: https://lms.gagneet.com

Login with: admin@lms.com / admin123

## Why This Is Needed

Your tunnel "home-server" uses REMOTE CONFIGURATION from CloudFlare's
API, which overrides local config files. The remote configuration
currently has these routes:

- eastgateresidences.com.au
- www.eastgateresidences.com.au
- mail.eastgateresidences.com.au
- eastgate.gagneet.com
- healthapp.gagneet.com
- retirement.gagneet.com
- hamees.gagneet.com
- skillsapien.com
- www.skillsapien.com
- lms.gagneet.com (MISSING - needs to be added)

Adding the public hostname in the dashboard adds it to the remote
configuration, which the tunnel will immediately pick up.

## Alternative (If dashboard doesn't work)

1. Switch tunnel to local configuration mode, OR
2. Use CloudFlare API to add the route

But the dashboard is the fastest way!
