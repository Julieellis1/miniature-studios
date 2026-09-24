/** @type {import('next').NextConfig} */
const nextConfig = {
  // No ESLint setup in this repo; type safety is enforced by `tsc --noEmit`.
  eslint: { ignoreDuringBuilds: true },
};
module.exports = nextConfig;
