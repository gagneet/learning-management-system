## 2025-05-14 - [Semantic Interactivity and Client-side Navigation]
**Learning:** In this Next.js app, several interactive components (like the NotificationBell) were using generic `div` tags for clickable items and `window.location.href` for navigation. This breaks keyboard accessibility and causes unnecessary full-page reloads.
**Action:** Always use semantic `button` or `Link` elements for interactive items to ensure keyboard support, and prefer Next.js `useRouter` or `Link` for navigation to maintain a smooth SPA experience.

## 2025-05-17 - [Accessible and Responsive Clickable Cards]
**Learning:** Generic "clickable div" patterns are common in card-based layouts but fail accessibility and theme-switching requirements. Using a polymorphic `ClickableCard` component that renders as a `Link` or `button` provides native focus management, keyboard activation, and consistent hover/focus styling.
**Action:** Use the `ClickableCard` pattern for all dashboard and landing page cards. Ensure focus-visible rings are present and the component supports both light and dark modes with Tailwind's `dark:` variant.
