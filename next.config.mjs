/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 启用 standalone 输出：构建产物自带最小 node_modules，便于 Docker 多阶段瘦身
  output: "standalone",
  experimental: {
    typedRoutes: false
  }
};

export default nextConfig;
