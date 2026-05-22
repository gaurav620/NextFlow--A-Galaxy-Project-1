import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: "proj_mefmcjxtwxhzfdbwzdim",
  runtime: "node",
  dirs: ["./src/trigger"],
  maxDuration: 900,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    extensions: [
      prismaExtension({
        mode: "legacy",
        schema: "prisma/schema.prisma",
      }),
    ],
  },
  /**
   * Inject environment variables into the Trigger.dev cloud runtime.
   * Without this, Prisma fails with "Environment variable not found: DATABASE_URL"
   * because tasks run on Trigger.dev's infrastructure, not Vercel.
   */
  deploy: {
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
    },
  },
});
