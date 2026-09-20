import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { execSync } from "child_process";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const allowedHost = env.VITE_ALLOWED_HOSTS;
  const apiTarget = env.VITE_API_TARGET;

  let gitVersion = "dev";

  try {
    gitVersion = execSync("git describe --tags --always", {
      encoding: "utf-8",
    }).trim();
  } catch {
    console.warn("Git not found or not a git repo, using dev version");
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "pulse-local-cache-recovery",
        apply: "serve",
        transformIndexHtml() {
          return [
            {
              tag: "script",
              injectTo: "head-prepend",
              children: `
              (async () => {
                if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
                if (!('caches' in window) || !('serviceWorker' in navigator)) return;
                const keys = await caches.keys();
                const legacy = keys.filter(key => key.startsWith('prism-crm-'));
                if (!legacy.length) return;
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                  const worker = registration.active || registration.waiting || registration.installing;
                  if (worker && new URL(worker.scriptURL).pathname === '/sw.js'
                    && new URL(registration.scope).pathname === '/') {
                    await registration.unregister();
                  }
                }
                await Promise.all(legacy.map(key => caches.delete(key)));
                location.reload();
              })().catch(error => console.warn('Local development cache cleanup failed', error));
            `,
            },
          ];
        },
      },
    ],

    define: {
      __APP_VERSION__: JSON.stringify(gitVersion),
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    server: {
      host: "::",
      port: 8080,
      // Avoid silently serving PulseMD on a different port when 8080 is occupied.
      strictPort: true,
      headers: {
        "Cache-Control": "no-store",
      },
      hmr: {
        // Use the browser's hostname, with PulseMD's fixed development port.
        clientPort: 8080,
        path: "/__pulsemd_hmr",
      },
      allowedHosts: allowedHost ? [allowedHost] : [],
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    preview: {
      host: "::",
      port: 8080,
      strictPort: true,
    },
  };
});
