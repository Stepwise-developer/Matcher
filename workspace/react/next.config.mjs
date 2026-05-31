/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/matcha",
  trailingSlash: true,
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.loca.lt"],
};

export default nextConfig;
