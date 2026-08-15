// next.config.mjs
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// Headers de sécurité (CSP sera injectée dynamiquement via proxy)
const securityHeaders = [
  // HSTS (active uniquement en prod et si tout le site est en HTTPS)
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),

  // Anti-MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Anti-clickjacking
  { key: "X-Frame-Options", value: "DENY" },

  // Limiter les fuites de référent
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Isolation contextuelle (limite certaines confusions fenêtre/process)
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },

  // Permissions minimales par défaut (à étendre si besoin)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig = {
  poweredByHeader: false, // Masque X-Powered-By: Next.js
  outputFileTracingRoot: projectRoot,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.ytimg.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "**.tiktokcdn.com" },
      { protocol: "https", hostname: "p16-sign-va.tiktokcdn.com" },
    ],
  },

  serverExternalPackages: ["@napi-rs/canvas"],

  // Injection des headers de sécurité (hors CSP)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  webpack: (config, { isServer, nextRuntime }) => {
    // client & edge : stub le module natif et ignore *.node
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

