/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'encrypted-tbn1.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.google.com',
      },
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
      },
      {
        protocol: "https",
        hostname: "**", // Allow all hostnames (use with caution in prod)
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000", // Optional, specify if only serving from this port
        pathname: "/uploads/**",
      },
    ],
  },
}

module.exports = nextConfig

