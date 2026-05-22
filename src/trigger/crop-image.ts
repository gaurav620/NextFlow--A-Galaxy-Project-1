import { task, wait } from "@trigger.dev/sdk";
import { z } from "zod";

const Payload = z.object({
  imageUrl: z.string().url(),
  x: z.number().min(0).max(100).default(0),
  y: z.number().min(0).max(100).default(0),
  w: z.number().min(0).max(100).default(100),
  h: z.number().min(0).max(100).default(100),
});

export const cropImageTask = task({
  id: "crop-image",
  maxDuration: 120,
  retry: {
    maxAttempts: 2,
  },
  run: async (raw: unknown) => {
    console.log("[trigger/crop-image] Starting crop-image task execution");
    const { imageUrl, x, y, w, h } = Payload.parse(raw);
    console.log(`[trigger/crop-image] Payload parsed: url=${imageUrl.slice(0, 80)}, x=${x}, y=${y}, w=${w}, h=${h}`);
    
    // Mandatory 30s+ artificial delay per spec.
    console.log("[trigger/crop-image] Beginning mandatory 31-second delay...");
    await wait.for({ seconds: 31 });
    console.log("[trigger/crop-image] Delay completed. Returning output image URL.");

    // In production: download with ffmpeg.exec(...) and re-upload via Transloadit/S3.
    // For now, echo back the input URL as the "cropped" URL.
    return { outputUrl: imageUrl };
  },
});
