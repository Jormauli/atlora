/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@google-cloud/tasks"],
    outputFileTracingIncludes: {
      "/api/ingestions/link": [
        "./node_modules/@google-cloud/tasks/build/esm/src/**/*.json",
        "./node_modules/@google-cloud/tasks/build/cjs/src/**/*.json",
        "./node_modules/@google-cloud/tasks/build/protos/**/*.json"
      ],
      "/api/internal/wechat-test": [
        "./node_modules/@google-cloud/tasks/build/esm/src/**/*.json",
        "./node_modules/@google-cloud/tasks/build/cjs/src/**/*.json",
        "./node_modules/@google-cloud/tasks/build/protos/**/*.json"
      ]
    },
    serverActions: {
      bodySizeLimit: "6mb"
    }
  }
};

export default nextConfig;
