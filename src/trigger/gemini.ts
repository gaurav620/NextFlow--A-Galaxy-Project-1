import { task } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const Payload = z.object({
  prompt: z.string(),
  system: z.string().optional(),
  model: z.string().default("gemini-1.5-flash"),
  imageUrl: z.string().optional(),
});

export const geminiTask = task({
  id: "gemini",
  maxDuration: 300,
  retry: {
    maxAttempts: 3,
  },
  run: async (raw: unknown) => {
    console.log("[trigger/gemini] Starting gemini task execution");
    const { prompt, system, model, imageUrl } = Payload.parse(raw);
    console.log(`[trigger/gemini] Payload parsed: model=${model}, promptLength=${prompt.length}, hasSystem=${!!system}, hasImageUrl=${!!imageUrl}`);

    // Multimodal vision path
    if (imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))) {
      try {
        console.log(`[trigger/gemini] Executing multimodal vision request with URL: ${imageUrl}`);
        const { text } = await generateText({
          model: google(model),
          system: system || undefined,
          messages: [{
            role: "user",
            content: [
              { type: "image", image: new URL(imageUrl) },
              { type: "text", text: prompt || "Describe this image." },
            ],
          }],
        });
        console.log("[trigger/gemini] Multimodal vision request completed successfully");
        return { text };
      } catch (visionErr) {
        console.warn("[trigger/gemini] Vision failed, falling back to text-only:", visionErr);
      }
    }

    // Text-only path
    try {
      console.log(`[trigger/gemini] Executing text-only request for model=${model}`);
      const { text } = await generateText({
        model: google(model),
        system: system || undefined,
        prompt: prompt || "Hello",
      });
      console.log("[trigger/gemini] Text-only request completed successfully");
      return { text };
    } catch (err) {
      console.error("[trigger/gemini] Text-only generation failed:", err);
      throw err;
    }
  },
});
