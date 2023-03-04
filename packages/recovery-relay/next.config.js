// @ts-check
const withTM = require("next-transpile-modules")([
  "@fireblocks/recovery-shared",
  "@fireblocks/wallet-derivation",
]);
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
});

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, options) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
};

// @ts-ignore
module.exports = withTM(withPWA(nextConfig));
