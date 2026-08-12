import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin", "jsonwebtoken", "bcryptjs"],
};

export default nextConfig;
