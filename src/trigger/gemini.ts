import { task } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const Payload = z.object({
  prompt: z.string(),
  system: z.string().optional(),
  model: z.string().default("gemini-2.5-flash"),
});

export const geminiTask = task({
  id: "gemini",
  maxDuration: 300,
  run: async (raw: unknown) => {
    const { prompt, system, model } = Payload.parse(raw);
    const { text } = await generateText({
      model: google(model),
      system,
      prompt,
    });
    return { text };
  },
});
