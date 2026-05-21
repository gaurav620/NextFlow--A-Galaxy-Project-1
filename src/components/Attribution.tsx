"use client";

import { useEffect } from "react";

// Spec requirement: log candidate LinkedIn URL to browser console
const LINKEDIN_URL =
  process.env.NEXT_PUBLIC_CANDIDATE_LINKEDIN_URL ??
  "https://www.linkedin.com/in/gauravkumarmehta/";

export function Attribution() {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(`%c[NextFlow] Built by Gaurav Kumar Mehta`, "color:#7c3aed;font-weight:bold;font-size:13px");
    // eslint-disable-next-line no-console
    console.log(`%c🔗 LinkedIn: ${LINKEDIN_URL}`, "color:#3b82f6;font-size:12px");
  }, []);
  return null;
}
