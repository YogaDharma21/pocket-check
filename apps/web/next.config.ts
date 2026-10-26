import type { NextConfig } from "next"
import path from "node:path"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@pocket-check/presets",
    "@pocket-check/types",
    "@pocket-check/weather",
    "@pocket-check/convex",
  ],
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
}

export default nextConfig
