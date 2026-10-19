import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // libSQL ships a native binary; keep it out of the server bundle.
  serverExternalPackages: ["@libsql/client"],
  experimental: {
    serverActions: {
      // Product image uploads go through Server Actions.
      bodySizeLimit: "8mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
