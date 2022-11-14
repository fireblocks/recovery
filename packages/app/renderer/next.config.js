module.exports = {
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = "electron-renderer";
    }

    return config;
  },
};
