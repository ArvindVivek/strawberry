import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps Turbopack's root at this app: the Kitchen Labs folder above holds other apps'
  // lockfiles, which must not confuse it.
  turbopack: { root: __dirname },
};

export default nextConfig;
