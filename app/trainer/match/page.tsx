"use client";

import MatchMode from "@/components/trainer/modules/MatchMode";

export default function MatchPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Match Mode</h1>
        <p className="text-sm text-muted mt-1">จับคู่ coaching phrases กับความหมายภาษาไทย</p>
      </div>
      <MatchMode />
    </div>
  );
}
