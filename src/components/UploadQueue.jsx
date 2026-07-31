"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPendingUploads, deleteRecording } from "../lib/audioDB";

function formatDate(value) {
  if (!value) {
    return "Unbekannt";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unbekannt";
  }
  return date.toLocaleString();
}

export default function UploadQueue({ refreshToken, onRetry, logs, onLog }) {
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [errorById, setErrorById] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadQueue = useCallback(async () => {
    try {
      const pending = await getPendingUploads();
      setItems(pending);
      setLoadError("");
      onLog?.(`Queue geladen: ${pending.length}`);
    } catch (error) {
      const message = error?.message || "Queue-Load fehlgeschlagen.";
      setLoadError(message);
      onLog?.(`Queue-Load Fehler: ${message}`);
    }
  }, [onLog]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue, refreshToken]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        loadQueue();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [loadQueue]);

  const handleDownload = useCallback((recording) => {
    if (!recording?.blob) {
      return;
    }
    const url = URL.createObjectURL(recording.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = recording.filename || `recording-${recording.id}.webm`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  }, []);

  const handleDelete = useCallback(async (id) => {
    await deleteRecording(id);
    await loadQueue();
  }, [loadQueue]);

  const handleRetry = useCallback(
    async (recording) => {
      setBusyId(recording.id);
      setErrorById((prev) => ({ ...prev, [recording.id]: "" }));
      const success = await onRetry(recording);
      if (!success) {
        setErrorById((prev) => ({
          ...prev,
          [recording.id]: "Upload fehlgeschlagen. Bitte erneut versuchen.",
        }));
      }
      await loadQueue();
      setBusyId(null);
    },
    [loadQueue, onRetry]
  );

  const emptyState = useMemo(() => items.length === 0, [items.length]);

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Upload-Warteschlange</h2>
          <p className="text-sm text-slate-500">Offene Uploads bleiben lokal gespeichert.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
            onClick={loadQueue}
            type="button"
          >
            Reload
          </button>
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
            onClick={() => setShowDebug((prev) => !prev)}
            type="button"
          >
            Debug
          </button>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {items.length}
          </span>
        </div>
      </div>

      {emptyState ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Keine offenen Uploads.
          {loadError ? <span className="block text-rose-600">{loadError}</span> : null}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((recording) => {
            const metaParts = [];
            if (recording.patient) metaParts.push(recording.patient);
            if (recording.topic) metaParts.push(recording.topic);
            if (metaParts.length === 0) metaParts.push("Ohne Metadaten");

            return (
              <div
                key={recording.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{recording.filename}</p>
                    <p className="text-xs text-slate-500">{formatDate(recording.createdAt)}</p>
                    <p className="text-xs text-slate-600">{metaParts.join(" · ")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recording.blob ? (
                      <button
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
                        onClick={() => handleDownload(recording)}
                        type="button"
                      >
                        Download
                      </button>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                        Text
                      </span>
                    )}
                    <button
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
                      onClick={() => handleRetry(recording)}
                      type="button"
                      disabled={busyId === recording.id}
                    >
                      {busyId === recording.id ? "Upload..." : "Retry Upload"}
                    </button>
                    <button
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300"
                      onClick={() => handleDelete(recording.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {errorById[recording.id] ? (
                  <p className="mt-2 text-xs text-rose-600">{errorById[recording.id]}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {showDebug ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-900 p-3 text-xs text-slate-100">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Debug Log</span>
            <span className="text-slate-400">{logs?.length || 0}</span>
          </div>
          <div className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono">
            {(logs || []).length === 0 ? "Keine Logs." : null}
            {(logs || []).map((entry, index) => (
              <div key={`${entry.ts}-${index}`}>
                [{entry.localTs || entry.ts}] {entry.message}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
