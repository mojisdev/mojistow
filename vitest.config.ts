import { defineWorkersProject } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersProject({
  test: {
    name: "mojistow.mojis.dev",
    poolOptions: {
      workers: {
        singleWorker: true,
        isolatedStorage: true,
        miniflare: {
          compatibilityFlags: ["nodejs_compat"],
          bindings: {
            ENVIRONMENT: "production",
            MOJIS_TOKEN: "test-token",
          },
        },
        wrangler: {
          configPath: "./wrangler.jsonc",
        },
      },
    },
  },
});
