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
  run: async (raw: unknown) => {
    const { imageUrl } = Payload.parse(raw);
    // Mandatory 30s+ artificial delay per spec.
    await wait.for({ seconds: 31 });
    // In production: download with ffmpeg.exec(...) and re-upload via Transloadit/S3.
    // For now, echo back the input URL as the "cropped" URL.
    return { outputUrl: imageUrl };
  },
});
