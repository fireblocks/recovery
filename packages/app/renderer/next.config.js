// @ts-check
const withTM = require("next-transpile-modules")(["shared"]);

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = "electron-renderer";
    }

    return config;
  },
};

module.exports = withTM(nextConfig);
