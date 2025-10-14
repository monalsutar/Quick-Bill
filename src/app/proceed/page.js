"use client";

import { Suspense } from "react";
import ProceedPageContent from "./ProceedPageContent";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function ProceedPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>}>
      <ProceedPageContent />
    </Suspense>
  );
}
