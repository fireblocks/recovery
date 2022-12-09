// @ts-check
const withTM = require("next-transpile-modules")(["styles"]);
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

// @ts-ignore
module.exports = withTM(withPWA(nextConfig));
