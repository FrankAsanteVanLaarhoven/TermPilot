import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  transpilePackages: ["@splinetool/runtime"],
  webpack(config, { webpack }) {
    // Spline's full runtime contains optional boolean/Draco loaders whose
    // binaries are not included in the published npm package. TermPilot's
    // procedural primitive rig uses neither feature, so exclude those dead
    // branches instead of making the production build depend on missing files.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /(?:boolean_wasm_bg\.wasm|libs\/draco\/(?:gltf\/)?(?:draco_decoder\.wasm|draco_wasm_wrapper\.js|draco_decoder\.js))$/,
      }),
    );
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api-backend/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
