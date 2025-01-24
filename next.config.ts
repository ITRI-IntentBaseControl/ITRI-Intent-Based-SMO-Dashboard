/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  env: {
    ACCESS_TOKEN_NAME: process.env.ACCESS_TOKEN_NAME,
    PROTOCAL: process.env.PROTOCAL,
    HOST: process.env.HOST,
    API_PORT: process.env.API_PORT,
    API_ROOT: process.env.API_ROOT,
    API_VERSION: process.env.API_VERSION,
    AUTH_HEADER_TYPE: process.env.AUTH_HEADER_TYPE,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
