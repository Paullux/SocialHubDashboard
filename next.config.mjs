// next.config.mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.ytimg.com" },     // covers i.ytimg.com
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "**.tiktokcdn.com" },
      { protocol: "https", hostname: "p16-sign-va.tiktokcdn.com" },
    ],
  },

  // ⬇️ new key name in Next 15
  serverExternalPackages: ["@napi-rs/canvas"],

  webpack: (config, { isServer, nextRuntime }) => {
    // Client & Edge: stub native canvas and ignore .node files
    if (!isServer || nextRuntime === "edge") {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "@napi-rs/canvas": false,
      };
      config.module.rules.push({
        test: /\.node$/,
        use: [{ loader: require.resolve("ignore-loader") }],
      });
    }

    // Node.js runtime: allow requiring native .node, keep it external
    const isNodeRuntime = isServer && (nextRuntime === "nodejs" || !nextRuntime);
    if (isNodeRuntime) {
      config.externals = [
        ...(config.externals || []),
        function (_ctx, req, cb) {
          if (req?.startsWith("@napi-rs/canvas")) return cb(null, "commonjs " + req);
          cb();
        },
      ];
      config.module.rules.push({
        test: /\.node$/,
        type: "asset/resource",
      });
    }

    return config;
  },
};

export default nextConfig;
