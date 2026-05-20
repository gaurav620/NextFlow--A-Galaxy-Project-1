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
      // Get the first result from any step
      const results = assembly?.results ?? {};
      const allResults = Object.values(results).flat();
      const firstResult = allResults[0];
      if (firstResult?.ssl_url) {
        opts.onComplete(firstResult.ssl_url);
      } else if (firstResult?.url) {
        opts.onComplete(firstResult.url);
      }
    });
  } else {
    // Fallback: no Transloadit keys → use local object URL for dev
    uppy.on("file-added", (file) => {
      if (file.data instanceof Blob) {
        opts.onComplete(URL.createObjectURL(file.data));
      }
    });
  }

  uppy.on("error", (err) => {
    opts.onError?.(err?.message ?? "Upload failed");
  });

  return uppy;
}
