/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  distDir: process.env.INKWELL_UI_TEST === "1" ? ".next-test" : ".next",
};

module.exports = nextConfig;
