# Nginx Rate Limiting Configuration

## Overview

The LMS uses nginx rate limiting to prevent abuse and protect against DDoS attacks. However, the initial configuration was too aggressive for normal use.

## Rate Limit Zones

```nginx
limit_req_zone $binary_remote_addr zone=lms_login:10m rate=20r/m;   # Login/auth endpoints
limit_req_zone $binary_remote_addr zone=lms_api:10m rate=100r/m;     # General API
limit_req_zone $binary_remote_addr zone=lms_general:10m rate=200r/m; # All other requests
```

## Endpoint Configuration

### `/api/auth/` (Authentication)
- **Rate**: 20 requests per minute
- **Burst**: 10 requests
- **Reason**: Handles login, callbacks, CSRF tokens, session checks

### `/api/` (General API)
- **Rate**: 100 requests per minute
- **Burst**: 20 requests
- **Reason**: General API operations, data fetching

### All Other Locations
- **Rate**: 200 requests per minute
- **Burst**: 50 requests
- **Reason**: Static files, pages, etc.

## Common 429 Errors

If users encounter "429 Too Many Requests":

1. **Check nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/lms_error.log
   ```

2. **Temporarily increase limits:**
   Edit `/etc/nginx/sites-available/lms` and increase rate/burst values

3. **Reload nginx:**
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. **Clear CloudFlare cache:**
   CloudFlare may cache 429 responses

## Recommended Values

Based on typical usage patterns:

- **Development/Testing**: Disable or set very high limits
- **Production (small team)**: Current values (20/100/200 per minute)
- **Production (large scale)**: Increase to 50/200/500 per minute or implement per-user tracking

## Applying Changes

After modifying `config/nginx/lms`:

```bash
# Copy to nginx directory
sudo cp /home/gagneet/lms/config/nginx/lms /etc/nginx/sites-available/lms

# Test configuration
sudo nginx -t

# Reload if test passes
sudo systemctl reload nginx
```

## Monitoring

Watch for rate limit errors:

```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/lms_error.log | grep "limiting requests"

# Check nginx access logs for 429 responses
sudo tail -f /var/log/nginx/lms_access.log | grep " 429 "
```

## History

- **2026-02-11**: Increased login rate from 5r/m to 20r/m and burst from 3 to 10 to fix 429 errors during normal use
- **2026-02-10**: Initial configuration with conservative limits

