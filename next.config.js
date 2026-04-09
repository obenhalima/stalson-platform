/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')('./i18n.ts')

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

module.exports = withNextIntl(nextConfig)
