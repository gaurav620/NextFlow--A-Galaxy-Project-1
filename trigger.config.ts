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
  // NOTE: DATABASE_URL and GOOGLE_GENERATIVE_AI_API_KEY are set directly
  // in Trigger.dev prod environment via the Management API:
  //   POST https://api.trigger.dev/api/v1/projects/{projectRef}/envvars/prod
  // They are visible at: cloud.trigger.dev → Environment Variables
});
