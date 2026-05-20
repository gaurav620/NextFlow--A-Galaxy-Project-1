"use client";

import { useEffect } from "react";

export function Attribution() {
  useEffect(() => {
    const url =
      process.env.NEXT_PUBLIC_CANDIDATE_LINKEDIN_URL ??
      "https://www.linkedin.com/in/REPLACE-ME";
    // eslint-disable-next-line no-console
    console.log(`[NextFlow] Candidate LinkedIn: ${url}`);
  }, []);
  return null;
}
