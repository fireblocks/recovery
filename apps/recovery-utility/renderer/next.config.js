// @ts-check
const withTM = require("next-transpile-modules")([
  "@fireblocks/recovery-shared",
  "@fireblocks/wallet-derivation",
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  eslint: { ignoreDuringBuilds: true }, // !!process.env.CI },
  webpack: (config, { isServer }) => ({
    ...config,
    target: isServer ? config.target : "electron-renderer",
  }),
};

module.exports = withTM(nextConfig);
