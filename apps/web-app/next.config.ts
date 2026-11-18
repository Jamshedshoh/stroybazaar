import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@stroybazaar/shared", "@stroybazaar/api-client", "@stroybazaar/ui"],
};

export default nextConfig;
