import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Repo ini berisi 2 package (root + admin-web), arahkan tracing ke folder ini.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
