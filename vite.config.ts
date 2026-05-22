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
    plugins: [react(), tailwindcss()],

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
    },
  };
});