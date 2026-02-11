# LMS Deployment Notes

## Important Configuration

### Tailwind CSS Version

**CRITICAL**: This project must use **Tailwind CSS v3** (stable version).

- ✅ **Current**: Tailwind CSS v3.x
- ❌ **DO NOT upgrade to v4**: Tailwind CSS v4 has compatibility issues with Next.js 16 that cause incomplete CSS generation

### Symptoms of Tailwind v4 Issue

If you see these symptoms after a build:
- CSS file is only ~5KB (should be ~21KB)
- Page loads but has no styling/formatting
- HTML classes like `text-5xl`, `from-blue-50`, `font-bold` don't work
- Browser shows unstyled content

### How to Fix

If accidentally upgraded to Tailwind v4:

```bash
# 1. Downgrade to v3
npm uninstall tailwindcss @tailwindcss/postcss
npm install -D tailwindcss@3 postcss autoprefixer

# 2. Update postcss.config.mjs
# Change from:
#   plugins: { '@tailwindcss/postcss': {} }
# To:
#   plugins: { tailwindcss: {}, autoprefixer: {} }

# 3. Clean rebuild
rm -rf .next
npm run build

# 4. Restart application
pm2 restart lms-nextjs

# 5. Purge CloudFlare cache
# Go to CloudFlare Dashboard → Caching → Purge Everything
```

### Verification After Build

Check CSS file size:
```bash
find .next/static/chunks -name "*.css" -exec ls -lh {} \;
```

Expected output: CSS file should be **~21KB** (not ~5KB)

Check CSS content:
```bash
find .next/static/chunks -name "*.css" -exec cat {} \; | grep -o "text-5xl\|from-blue-50\|font-bold"
```

Expected output: Should find these class names

## Package.json Dependencies

Current working configuration:

```json
{
  "devDependencies": {
    "tailwindcss": "^3.x.x",
    "autoprefixer": "^10.x.x",
    "postcss": "^8.x.x"
  }
}
```

**DO NOT install**: `@tailwindcss/postcss` package

## PostCSS Configuration

File: `postcss.config.mjs`

```javascript
const config = {
  plugins: {
    tailwindcss: {},      // ✅ Correct (v3)
    autoprefixer: {},
  },
};
```

**NOT**:
```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},  // ❌ Wrong (v4)
  },
};
```

## Deployment Checklist

When deploying updates:

- [ ] Verify Tailwind CSS v3 is installed
- [ ] Check postcss.config.mjs uses correct plugins
- [ ] Run clean build: `rm -rf .next && npm run build`
- [ ] Verify CSS file size is ~21KB
- [ ] Restart PM2: `pm2 restart lms-nextjs`
- [ ] Purge CloudFlare cache
- [ ] Test in browser (hard refresh)
- [ ] Verify styling is applied

## Automated Build Script

The `scripts/build-and-deploy.sh` script now includes:
- Automatic `.next` directory cleanup before build
- CSS file size verification after build
- Warning if CSS is smaller than expected

Usage:
```bash
./scripts/build-and-deploy.sh
```

## CloudFlare Cache Management

After deployment, always purge CloudFlare cache:

**Manual Method:**
1. Go to: https://dash.cloudflare.com
2. Select `gagneet.com` domain
3. Caching → Configuration
4. Click "Purge Everything"

**Or use API** (requires credentials):
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "X-Auth-Email: YOUR_EMAIL" \
  -H "X-Auth-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Troubleshooting

### CSS Not Loading After Deployment

1. **Check CSS file locally**:
   ```bash
   ls -lh .next/static/chunks/*.css
   ```
   Should be ~21KB

2. **Check CSS served by CloudFlare**:
   ```bash
   curl -s https://lms.gagneet.com | grep -o "\.css"
   ```

3. **Purge CloudFlare cache**

4. **Hard refresh browser**:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

### Still No Styling

1. Verify PostCSS config
2. Verify Tailwind v3 is installed
3. Clean rebuild: `rm -rf .next node_modules && npm install && npm run build`
4. Check browser console for errors

## Version History

- **2026-02-11**: Downgraded from Tailwind v4 to v3 to fix CSS generation issues
- **2026-02-10**: Initial production deployment

## References

- [Tailwind CSS v3 Documentation](https://v3.tailwindcss.com/)
- [Next.js CSS Documentation](https://nextjs.org/docs/app/building-your-application/styling/css)
- [CloudFlare Cache Documentation](https://developers.cloudflare.com/cache/)
