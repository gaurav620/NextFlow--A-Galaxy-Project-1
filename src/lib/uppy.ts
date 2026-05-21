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

    uppy.on("transloadit:complete", (assembly) => {
      console.log("[Transloadit] assembly complete:", assembly?.assembly_id);

      // Try to find a URL from any result step
      // Step order of preference: last processing step → :original
      const results = assembly?.results ?? {};
      const allResults = Object.values(results)
        .flat() as Array<{ ssl_url?: string; url?: string; name?: string }>;

      // Look for ssl_url first (Transloadit CDN), then url
      for (const result of allResults) {
        const url = result?.ssl_url ?? result?.url;
        if (url && url.startsWith("http")) {
          console.log("[Transloadit] Using result URL:", url.slice(0, 80));
          opts.onComplete(url);
          return;
        }
      }

      // Fallback: try to get the URL from uploads field
      const uploads = assembly?.uploads as Array<{ ssl_url?: string; url?: string }> | undefined;
      if (uploads && uploads.length > 0) {
        const uploadUrl = uploads[0]?.ssl_url ?? uploads[0]?.url;
        if (uploadUrl) {
          console.log("[Transloadit] Using upload URL (no results):", uploadUrl.slice(0, 80));
          opts.onComplete(uploadUrl);
          return;
        }
      }

      console.warn("[Transloadit] No URL found in assembly results:", JSON.stringify(results).slice(0, 200));
      opts.onError?.("Upload processed but no image URL returned. Check your Transloadit template has an export step.");
    });

    uppy.on("transloadit:assembly-error", (assembly, error) => {
      console.error("[Transloadit] Assembly error:", error);
      opts.onError?.(`Transloadit error: ${error?.message ?? "Unknown error"}`);
    });

  } else {
    // Fallback for dev: no Transloadit keys → use local object URL
    console.warn("[Uppy] Transloadit keys not set — using dev object URL fallback.");
    uppy.on("file-added", (file) => {
      if (file.data instanceof Blob) {
        opts.onComplete(URL.createObjectURL(file.data));
      }
    });
  }

  uppy.on("error", (err) => {
    console.error("[Uppy] Error:", err);
    opts.onError?.(err?.message ?? "Upload failed");
  });

  return uppy;
}
