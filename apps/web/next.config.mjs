/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ventry/ui", "@ventry/db", "@ventry/queue"],
};

export default nextConfig;
