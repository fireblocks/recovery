// @ts-check
const withTM = require('next-transpile-modules')([
  '@fireblocks/asset-config',
  '@fireblocks/recovery-shared',
  '@fireblocks/wallet-derivation',
]);
// @ts-ignore
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: false,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  eslint: { ignoreDuringBuilds: true }, // !!process.env.CI },
  webpack: (config) => ({
    ...config,
    experiments: {
      ...config.experiments,
      asyncWebAssembly: true,
    },
  }),
};

// @ts-ignore
module.exports = withTM(withPWA(nextConfig));
