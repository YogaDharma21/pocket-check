import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@pocket-check/presets",
    "@pocket-check/types",
    "@pocket-check/weather",
    "@pocket-check/convex",
  ],
}

export default nextConfig
