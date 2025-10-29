"use client";

import { Suspense } from "react";
import BillDisplay from "./BillDisplay";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading bill details...</div>}>
      <BillDisplay />
    </Suspense>
  );
}
