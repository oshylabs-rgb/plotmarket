import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // A stray package-lock.json in the user profile directory made Next infer
  // C:\Users\aoshe as the workspace root. Pin the root to this project.
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default nextConfig
