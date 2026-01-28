import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  reactStrictMode: true,

  images: {
    domains: ["lh3.googleusercontent.com"]
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }

};

export default nextConfig;