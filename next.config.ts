import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Disable image optimization in production (serve images directly)
    unoptimized: true,
  },
  async redirects() {
    return [
      // ── Supervisor sub-pages → main supervisor dashboard sections ─────
      // The supervisor dashboard contains all data as collapsible sections.
      // These redirects prevent 404s on linked-but-unimplemented sub-routes.
      {
        source: "/dashboard/supervisor/attendance",
        destination: "/dashboard/supervisor",
        permanent: false,
      },
      {
        source: "/dashboard/supervisor/tutors",
        destination: "/dashboard/supervisor",
        permanent: false,
      },
      {
        source: "/dashboard/supervisor/transactions",
        destination: "/dashboard/supervisor",
        permanent: false,
      },
      {
        source: "/dashboard/supervisor/reports",
        destination: "/dashboard/supervisor",
        permanent: false,
      },
      {
        source: "/dashboard/supervisor/fees",
        destination: "/dashboard/supervisor",
        permanent: false,
      },
      {
        source: "/dashboard/supervisor/tutor-payments",
        destination: "/dashboard/supervisor",
        permanent: false,
      },
      {
        source: "/dashboard/supervisor/budget",
        destination: "/dashboard/supervisor",
        permanent: false,
      },
      // Student analytics → dedicated analytics page (exists)
      {
        source: "/dashboard/supervisor/analytics",
        destination: "/admin/analytics",
        permanent: false,
      },
      // ── Parent sub-pages → main parent dashboard ──────────────────────
      // Parent dashboard shows all children's data in one scrollable page.
      {
        source: "/dashboard/parent/progress",
        destination: "/dashboard/parent",
        permanent: false,
      },
      {
        source: "/dashboard/parent/sessions",
        destination: "/dashboard/parent",
        permanent: false,
      },
      {
        source: "/dashboard/parent/homework",
        destination: "/dashboard/parent",
        permanent: false,
      },
      {
        source: "/dashboard/parent/achievements",
        destination: "/dashboard/parent",
        permanent: false,
      },
      {
        source: "/dashboard/parent/payments",
        destination: "/dashboard/parent",
        permanent: false,
      },
      {
        source: "/dashboard/parent/messages",
        destination: "/dashboard/parent",
        permanent: false,
      },
      // ── Admin sub-pages not yet implemented ───────────────────────────
      {
        source: "/admin/centers",
        destination: "/admin/users",
        permanent: false,
      },
      {
        source: "/admin/settings",
        destination: "/dashboard/settings",
        permanent: false,
      },
      {
        source: "/admin/awards",
        destination: "/admin/analytics",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
