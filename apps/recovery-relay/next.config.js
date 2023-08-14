/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  eslint: { ignoreDuringBuilds: true }, // !!process.env.CI },
  transpilePackages: ['@fireblocks/asset-config', '@fireblocks/recovery-shared', '@fireblocks/wallet-derivation'],
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    config.resolve.fallback = { fs: false };

    if (!isServer) {
      config.target = 'electron-renderer';
    }

    return {
      ...config,
      experiments: {
        ...config.experiments,
        asyncWebAssembly: true,
      },
    };
  },
};

// @ts-ignore
module.exports = nextConfig;
