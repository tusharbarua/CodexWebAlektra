const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: process.env.SERVER_ACTION_BODY_SIZE_LIMIT ?? "80mb"
    }
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" }
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

async function applyBundleAnalyzer(config) {
  if (process.env.ANALYZE !== "true") return config;
  const bundleAnalyzer = (await import("@next/bundle-analyzer")).default;
  return bundleAnalyzer({ enabled: true })(config);
}

export default await applyBundleAnalyzer(nextConfig);
