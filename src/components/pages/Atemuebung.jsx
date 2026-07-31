"use client";

import HrvAtemApp from "../blog/HrvAtemApp";

export default function AtemuebungPage() {
  return (
    <main className="flex min-h-[calc(100dvh-5rem)] flex-col items-center px-4 py-6">
      <div className="w-full max-w-lg">
        <h1 className="mb-1 text-center font-heading text-2xl font-bold text-slate-900">
          HRV-Atemübung
        </h1>

        <HrvAtemApp fullscreen />
      </div>
    </main>
  );
}
