/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@google-cloud/tasks"],
    serverActions: {
      bodySizeLimit: "6mb"
    }
  }
};

export default nextConfig;
