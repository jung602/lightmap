import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/lightmap",
  assetPrefix: "/lightmap",
  output: "export",
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // GLSL 셰이더 파일을 문자열로 import 가능하게 설정
    config.module.rules.push({
      test: /\.glsl$/,
      use: 'raw-loader',
    });

    return config;
  },
};

export default nextConfig;
