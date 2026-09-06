import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack ignores the stray package-lock.json
  // in the user's home directory (removes the recurring build warning).
  turbopack: {
    root: __dirname,
  },
  // The red "N" bubble in the corner is the Next.js dev-tools indicator —
  // disabled deliberately now that the app has its own chrome.
  devIndicators: false,
};

export default nextConfig;
