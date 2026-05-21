"use client";

import Uppy from "@uppy/core";
import Transloadit from "@uppy/transloadit";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Create a single-use Uppy instance configured for Transloadit image uploads.
 * Call `.destroy()` when done (e.g., on component unmount).
 *
 * If Transloadit env vars are not set, falls back to a local object URL
 * (useful for development without Transloadit credentials).
 */
export function createImageUppy(opts: {
  onComplete: (url: string) => void;
  onError?: (msg: string) => void;
}) {
  const authKey = process.env.NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY;
  const templateId = process.env.NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID;

  const uppy = new Uppy({
    restrictions: {
      maxNumberOfFiles: 1,
      allowedFileTypes: ALLOWED_TYPES,
      maxFileSize: 10 * 1024 * 1024, // 10 MB
    },
    autoProceed: false,
  });

  if (authKey && templateId) {
    uppy.use(Transloadit, {
      waitForEncoding: true,
      assemblyOptions: {
        params: {
          auth: { key: authKey },
          template_id: templateId,
        },
      },
    });

    // Handle successful Transloadit assembly completion
    uppy.on("transloadit:complete", (assembly) => {
      console.log("[Transloadit] assembly complete:", assembly?.assembly_id);
      const results = assembly?.results ?? {};
      const allResults = Object.values(results).flat() as Array<{
        ssl_url?: string;
        url?: string;
      }>;

      if (allResults.length === 0) {
        // No results — the template might not have an export step
        // Try to use the Transloadit CDN URL from uploads directly
        console.warn("[Transloadit] No results from assembly. Check your template has an export/store step.");
        opts.onError?.("Upload succeeded but template returned no results. Check your Transloadit template.");
        return;
      }

      const firstResult = allResults[0];
      const url = firstResult?.ssl_url ?? firstResult?.url;
      if (url) {
        console.log("[Transloadit] Got URL:", url);
        opts.onComplete(url);
      } else {
        opts.onError?.("Upload succeeded but could not extract URL from result.");
      }
    });

    uppy.on("transloadit:assembly-error", (assembly, error) => {
      console.error("[Transloadit] Assembly error:", error);
      opts.onError?.(`Transloadit error: ${error?.message ?? "Unknown error"}`);
    });
  } else {
    // Fallback: no Transloadit keys → use local object URL (dev mode only)
    console.warn("[Uppy] NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY or NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID not set. Using local object URL fallback.");

    uppy.on("file-added", (file) => {
      if (file.data instanceof Blob) {
        const url = URL.createObjectURL(file.data);
        console.log("[Uppy] Dev fallback — using object URL:", url);
        opts.onComplete(url);
      }
    });
  }

  uppy.on("error", (err) => {
    console.error("[Uppy] Error:", err);
    opts.onError?.(err?.message ?? "Upload failed");
  });

  return uppy;
}
