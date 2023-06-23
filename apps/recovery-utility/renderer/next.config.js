/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // output: 'export', // Cannot be used with nextron
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  eslint: { ignoreDuringBuilds: true }, // !!process.env.CI },
  transpilePackages: ['@fireblocks/asset-config', '@fireblocks/recovery-shared', '@fireblocks/wallet-derivation'],
  webpack: (config, { isServer }) => ({
    ...config,
    target: isServer ? config.target : 'electron-renderer',
    experiments: {
      ...config.experiments,
      asyncWebAssembly: true,
    },
  }),
};

module.exports = nextConfig;
