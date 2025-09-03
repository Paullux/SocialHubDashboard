// next.config.mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.ytimg.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "**.tiktokcdn.com" },
      { protocol: "https", hostname: "p16-sign-va.tiktokcdn.com" },
    ],
  },

  serverExternalPackages: ["@napi-rs/canvas"],

  webpack: (config, { isServer, nextRuntime }) => {
    // Client & Edge : stub le module natif et ignore *.node
    if (!isServer || nextRuntime === "edge") {
      config.resolve ??= {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "@napi-rs/canvas": false,
      };
      config.module.rules.push({
        test: /\.node$/,
        use: [{ loader: require.resolve("ignore-loader") }],
      });
    }

    // Node.js runtime : externalise le module natif
    const isNodeRuntime =
      isServer && (nextRuntime === "nodejs" || !nextRuntime);
    if (isNodeRuntime) {
      config.externals = [
        ...(config.externals || []),
        // ✅ nouvelle signature ({ context, request }, cb)
        ({ request }, cb) => {
          if (request?.startsWith("@napi-rs/canvas")) {
            return cb(null, "commonjs " + request);
          }
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
