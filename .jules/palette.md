## 2025-05-14 - [Semantic Interactivity and Client-side Navigation]
**Learning:** In this Next.js app, several interactive components (like the NotificationBell) were using generic `div` tags for clickable items and `window.location.href` for navigation. This breaks keyboard accessibility and causes unnecessary full-page reloads.
**Action:** Always use semantic `button` or `Link` elements for interactive items to ensure keyboard support, and prefer Next.js `useRouter` or `Link` for navigation to maintain a smooth SPA experience.
