/** @type {import('next').NextConfig} */
const extraAllowedDevOrigins = (
  process.env.NEXT_ALLOWED_DEV_ORIGINS ?? ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig = {
  basePath: "/matcha",
  trailingSlash: true,
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.localhost",
    "10.*.*.*",
    "172.*.*.*",
    "192.168.*.*",
    "*.local",
    "*.lan",
    "*.loca.lt",
    ...extraAllowedDevOrigins,
  ],
};

export default nextConfig;
