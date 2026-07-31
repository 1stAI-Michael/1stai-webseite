"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import UploadQueue from "../UploadQueue";
import { saveRecording, saveTextEntry, markAsUploaded } from "../../lib/audioDB";
import { uploadRecording, uploadTextOnly } from "../../lib/api";
import { getSettings } from "../../lib/storage";

const STATUS = {
  idle: "Bereit",
  recording: "Aufnahme laeuft",
  paused: "Pausiert",
  uploading: "Upload laeuft",
  uploadFailed: "Upload fehlgeschlagen",
  uploadSuccess: "Upload erfolgreich",
  error: "Fehler",
};

const CHUNK_TIMEOUT_MS = 6000;
const NON_EMPTY_CHUNK_TIMEOUT_MS = 15000;
const AUDIO_ACTIVITY_TIMEOUT_MS = 20000;
const MIN_VALID_BLOB_BYTES = 2048;

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function buildFilename(mode, prefix, createdAt) {
  const safeTimestamp = createdAt.replace(/[:.]/g, "-");
  const safeMode = mode && mode !== "2 Personen" ? mode.replace(/\s+/g, "_") : "";
  const safePrefix = (prefix || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9-_]/g, "");
  const base = `recording-${safeTimestamp}.webm`;
  const withPrefix = safePrefix ? `${safePrefix}-${base}` : base;
  return safeMode ? `${safeMode}-${withPrefix}` : withPrefix;
}

function buildTextLabel(mode, prefix, createdAt) {
  const safeTimestamp = createdAt.replace(/[:.]/g, "-");
  const safeMode = mode && mode !== "2 Personen" ? mode.replace(/\s+/g, "_") : "";
  const safePrefix = (prefix || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9-_]/g, "");
  const base = `text-${safeTimestamp}`;
  const withPrefix = safePrefix ? `${safePrefix}-${base}` : base;
  return safeMode ? `${safeMode}-${withPrefix}` : withPrefix;
}

export default function Recorder() {
  const [status, setStatus] = useState(STATUS.idle);
  const [statusDetail, setStatusDetail] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savedNotice, setSavedNotice] = useState(false);
  const [logs, setLogs] = useState([]);
  const [mode, setMode] = useState("2 Personen");
  const [hasAudioRecorded, setHasAudioRecorded] = useState(false);
  const [missingCredentials, setMissingCredentials] = useState(false);

  const [patient, setPatient] = useState("");
  const [dob, setDob] = useState("");
  const [topic, setTopic] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);
  const accumulatedMsRef = useRef(0);
  const noticeTimerRef = useRef(null);

  const wakeLockRef = useRef(null);
  const watchdogTimerRef = useRef(null);
  const audioTrackRef = useRef(null);
  const trackMutedRef = useRef(false);
  const autoPausedRef = useRef(false);
  const lastChunkAtRef = useRef(0);
  const lastNonEmptyChunkAtRef = useRef(0);
  const lastAudioActivityAtRef = useRef(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const analyserBufferRef = useRef(null);

  const addLog = useCallback((message) => {
    setLogs((prev) => {
      const now = new Date();
      const next = [
        ...prev,
        { ts: now.toISOString(), localTs: now.toLocaleString(), message },
      ];
      return next.slice(-200);
    });
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {
      wakeLockRef.current = null;
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }
    try {
      if (wakeLockRef.current) {
        return;
      }
      const sentinel = await navigator.wakeLock.request("screen");
      wakeLockRef.current = sentinel;
      sentinel.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
      addLog("Wake Lock aktiv (Display bleibt an, solange moeglich)");
    } catch (error) {
      addLog(`Wake Lock nicht verfuegbar: ${error?.message || "unbekannt"}`);
    }
  }, [addLog]);

  const cleanupMonitoring = useCallback(async () => {
    if (watchdogTimerRef.current) {
      window.clearInterval(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }

    if (audioTrackRef.current) {
      audioTrackRef.current.onmute = null;
      audioTrackRef.current.onunmute = null;
      audioTrackRef.current.onended = null;
      audioTrackRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.oninactive = null;
    }

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {
        // no-op
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    analyserBufferRef.current = null;
    trackMutedRef.current = false;
    autoPausedRef.current = false;
    lastChunkAtRef.current = 0;
    lastNonEmptyChunkAtRef.current = 0;
    lastAudioActivityAtRef.current = 0;

    await releaseWakeLock();
  }, [releaseWakeLock]);

  const pauseDueToAudioIssue = useCallback((detail, logMessage) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") {
      return;
    }
    if (autoPausedRef.current) {
      return;
    }
    autoPausedRef.current = true;
    setStatusDetail(detail);
    addLog(logMessage);
    try {
      recorder.pause();
    } catch (error) {
      setStatus(STATUS.error);
      setStatusDetail(error?.message || detail);
    }
  }, [addLog]);

  const sampleAudioActivity = useCallback(() => {
    if (!analyserRef.current || !analyserBufferRef.current) {
      return;
    }

    analyserRef.current.getByteTimeDomainData(analyserBufferRef.current);

    let sumSquares = 0;
    for (let index = 0; index < analyserBufferRef.current.length; index += 1) {
      const normalized = (analyserBufferRef.current[index] - 128) / 128;
      sumSquares += normalized * normalized;
    }

    const rms = Math.sqrt(sumSquares / analyserBufferRef.current.length);
    if (rms > 0.01) {
      lastAudioActivityAtRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    if (!isRecording) {
      accumulatedMsRef.current = 0;
      startedAtRef.current = null;
      setElapsedSeconds(0);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (isPaused) {
      if (startedAtRef.current) {
        accumulatedMsRef.current += Date.now() - startedAtRef.current;
        startedAtRef.current = null;
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!startedAtRef.current) {
      startedAtRef.current = Date.now();
    }

    timerRef.current = window.setInterval(() => {
      const now = Date.now();
      const runningMs = startedAtRef.current ? now - startedAtRef.current : 0;
      const totalMs = accumulatedMsRef.current + runningMs;
      setElapsedSeconds(Math.floor(totalMs / 1000));
    }, 500);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, isRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
      cleanupMonitoring();
    };
  }, [cleanupMonitoring]);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const onVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        addLog("App im Hintergrund/Sperrbildschirm - Audio kann durch Browser/OS gedrosselt werden");
        return;
      }

      addLog("App wieder im Vordergrund");
      if (!isPaused) {
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [addLog, isPaused, isRecording, requestWakeLock]);

  const cleanupStream = useCallback(async () => {
    await cleanupMonitoring();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [cleanupMonitoring]);

  const attemptUpload = useCallback(async (recording) => {
    setIsUploading(true);
    setStatus(STATUS.uploading);
    setStatusDetail("");
    try {
      const settings = getSettings();
      addLog(`Upload start: ${recording.filename} (user=${settings.username || "leer"}, device=${settings.deviceId?.slice(0, 8) || "?"})`);
      if (recording.type === "text" || !recording.blob) {
        await uploadTextOnly(
          {
            patient: recording.patient,
            dob: recording.dob,
            topic: recording.topic,
            createdAt: recording.createdAt,
          },
          settings
        );
      } else {
        await uploadRecording(recording, settings);
      }
      await markAsUploaded(recording.id);
      setStatus(STATUS.uploadSuccess);
      addLog(`Upload OK: ${recording.filename}`);
      setRefreshToken((value) => value + 1);
      return true;
    } catch (error) {
      setStatus(STATUS.uploadFailed);
      const rawMessage = error?.message || "";
      const message =
        rawMessage === "Failed to fetch"
          ? "Upload fehlgeschlagen. Netzwerk oder CORS-Blockierung."
          : error.devicePending
            ? rawMessage
            : rawMessage || "Upload fehlgeschlagen.";
      setStatusDetail(message);
      addLog(`Upload Fehler: ${recording.filename} - ${message}`);
      return false;
    } finally {
      setRefreshToken((value) => value + 1);
      setIsUploading(false);
    }
  }, [addLog]);

  const sendTextOnly = useCallback(async () => {
    const trimmedPatient = patient.trim();
    const trimmedDob = dob.trim();
    const trimmedTopic = topic.trim();
    if (!trimmedPatient && !trimmedDob && !trimmedTopic) {
      return;
    }
    const createdAt = new Date().toISOString();
    const settings = getSettings();
    const label = buildTextLabel(mode, settings.username, createdAt);
    const meta = {
      createdAt,
      filename: label,
      patient: trimmedPatient,
      dob: trimmedDob,
      topic: trimmedTopic,
      type: "text",
    };

    let id = null;
    try {
      id = await saveTextEntry(meta);
      setRefreshToken((value) => value + 1);
      addLog(`Text gespeichert lokal: ${label} (id ${id})`);
      setSavedNotice(true);
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
      noticeTimerRef.current = window.setTimeout(() => setSavedNotice(false), 4000);
      setPatient("");
      setDob("");
      setTopic("");
    } catch (error) {
      setStatus(STATUS.error);
      setStatusDetail(error?.message || "Speichern fehlgeschlagen.");
      addLog(`Speichern fehlgeschlagen: ${error?.message || "unbekannt"}`);
      return;
    }

    await attemptUpload({
      id,
      blob: null,
      ...meta,
    });
  }, [addLog, attemptUpload, dob, mode, patient, topic]);

  const startRecording = useCallback(async () => {
    setStatusDetail("");
    setMissingCredentials(false);
    const currentSettings = getSettings();
    if (!currentSettings.username?.trim() || !currentSettings.password?.trim()) {
      setMissingCredentials(true);
      setStatus(STATUS.error);
      setStatusDetail("Keine Zugangsdaten hinterlegt. Aufnahme nicht gestartet.");
      addLog("Start abgebrochen: keine Credentials hinterlegt");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus(STATUS.error);
      setStatusDetail("Mikrofonzugriff wird nicht unterstuetzt.");
      return;
    }
    if (!window.MediaRecorder) {
      setStatus(STATUS.error);
      setStatusDetail("MediaRecorder wird nicht unterstuetzt.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error("Kein Audio-Track verfuegbar.");
      }

      audioTrackRef.current = audioTrack;
      audioTrack.onmute = () => {
        trackMutedRef.current = true;
        setStatusDetail("Mikrofon wurde stummgeschaltet oder vom System gedrosselt.");
        addLog("Audio-Track: mute");
      };
      audioTrack.onunmute = () => {
        trackMutedRef.current = false;
        setStatusDetail("");
        lastAudioActivityAtRef.current = Date.now();
        addLog("Audio-Track: unmute");
      };
      audioTrack.onended = () => {
        pauseDueToAudioIssue(
          "Mikrofon-Track wurde beendet (z. B. System/Lockscreen). Aufnahme pausiert.",
          "Audio-Track: ended -> Aufnahme automatisch pausiert"
        );
      };

      stream.oninactive = () => {
        pauseDueToAudioIssue(
          "Audio-Stream ist inaktiv geworden. Aufnahme pausiert.",
          "Audio-Stream: inactive -> Aufnahme automatisch pausiert"
        );
      };

      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioContextCtor) {
        try {
          const audioContext = new AudioContextCtor();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;
          source.connect(analyser);
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          analyserBufferRef.current = new Uint8Array(analyser.fftSize);
        } catch (error) {
          addLog(`Audio-Analyse nicht initialisiert: ${error?.message || "unbekannt"}`);
        }
      }

      const options = {};
      if (window.MediaRecorder?.isTypeSupported?.("audio/webm")) {
        options.mimeType = "audio/webm";
      }
      const recorder = new MediaRecorder(stream, options);

      lastChunkAtRef.current = Date.now();
      lastNonEmptyChunkAtRef.current = Date.now();
      lastAudioActivityAtRef.current = Date.now();
      autoPausedRef.current = false;

      recorder.ondataavailable = (event) => {
        lastChunkAtRef.current = Date.now();
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          lastNonEmptyChunkAtRef.current = Date.now();
        }
      };

      recorder.onpause = async () => {
        setIsPaused(true);
        setStatus(STATUS.paused);
        await releaseWakeLock();
      };

      recorder.onresume = async () => {
        autoPausedRef.current = false;
        setIsPaused(false);
        setStatus(STATUS.recording);
        setStatusDetail("");
        await requestWakeLock();
      };

      recorder.onerror = (event) => {
        setStatus(STATUS.error);
        setStatusDetail(event.error?.message || "Fehler bei der Aufnahme.");
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        setIsPaused(false);

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];

        await cleanupStream();

        if (blob.size < MIN_VALID_BLOB_BYTES) {
          setStatus(STATUS.error);
          setStatusDetail("Aufnahme enthaelt keine verwertbaren Audiodaten.");
          addLog(`Ungueltige Aufnahme verworfen: blob.size=${blob.size}`);
          return;
        }

        const createdAt = new Date().toISOString();
        const settings = getSettings();
        const filename = buildFilename(mode, settings.username, createdAt);
        const meta = {
          createdAt,
          filename,
          patient: patient.trim(),
          dob: dob.trim(),
          topic: topic.trim(),
          type: "audio",
        };

        let id = null;
        try {
          id = await saveRecording(blob, meta);
          setRefreshToken((value) => value + 1);
          addLog(`Gespeichert lokal: ${filename} (id ${id}, size=${blob.size})`);
          setHasAudioRecorded(true);
          setSavedNotice(true);
          if (noticeTimerRef.current) {
            window.clearTimeout(noticeTimerRef.current);
          }
          noticeTimerRef.current = window.setTimeout(() => setSavedNotice(false), 4000);
          setPatient("");
          setDob("");
          setTopic("");
        } catch (error) {
          setStatus(STATUS.error);
          setStatusDetail(error?.message || "Speichern fehlgeschlagen.");
          addLog(`Speichern fehlgeschlagen: ${error?.message || "unbekannt"}`);
          return;
        }

        await attemptUpload({
          id,
          blob,
          ...meta,
        });
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
      setStatus(STATUS.recording);
      addLog("Aufnahme gestartet (timeslice 1000ms)");
      await requestWakeLock();

      if (watchdogTimerRef.current) {
        window.clearInterval(watchdogTimerRef.current);
      }

      watchdogTimerRef.current = window.setInterval(() => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
          return;
        }

        sampleAudioActivity();

        const now = Date.now();
        if (now - lastChunkAtRef.current > CHUNK_TIMEOUT_MS) {
          pauseDueToAudioIssue(
            "Keine Recorder-Daten mehr empfangen. Aufnahme pausiert.",
            "Watchdog: Keine dataavailable-Events -> Aufnahme pausiert"
          );
          return;
        }

        if (trackMutedRef.current && now - lastNonEmptyChunkAtRef.current > NON_EMPTY_CHUNK_TIMEOUT_MS) {
          pauseDueToAudioIssue(
            "Mikrofon ist stumm/gedrosselt und liefert keine Audiodaten. Aufnahme pausiert.",
            "Watchdog: Track muted + keine Audiodaten -> Aufnahme pausiert"
          );
          return;
        }

        if (now - lastAudioActivityAtRef.current > AUDIO_ACTIVITY_TIMEOUT_MS && now - lastNonEmptyChunkAtRef.current > AUDIO_ACTIVITY_TIMEOUT_MS) {
          pauseDueToAudioIssue(
            "Keine Audioaktivitaet erkannt. Bitte Mikrofon/Lockscreen pruefen und dann Resume druecken.",
            "Watchdog: Keine Audioaktivitaet erkannt -> Aufnahme pausiert"
          );
        }
      }, 1000);
    } catch (error) {
      setStatus(STATUS.error);
      setStatusDetail(error?.message || "Mikrofonzugriff fehlgeschlagen.");
      await cleanupStream();
      addLog(`Start fehlgeschlagen: ${error?.message || "unbekannt"}`);
    }
  }, [
    addLog,
    attemptUpload,
    cleanupStream,
    dob,
    mode,
    patient,
    pauseDueToAudioIssue,
    requestWakeLock,
    releaseWakeLock,
    sampleAudioActivity,
    topic,
  ]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) {
      return;
    }
    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      addLog("Aufnahme gestoppt");
    }
  }, [addLog]);

  const pauseRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
      return;
    }
    autoPausedRef.current = false;
    mediaRecorderRef.current.pause();
    addLog("Aufnahme pausiert");
  }, [addLog]);

  const resumeRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "paused") {
      return;
    }
    autoPausedRef.current = false;
    setStatusDetail("");
    lastChunkAtRef.current = Date.now();
    lastNonEmptyChunkAtRef.current = Date.now();
    lastAudioActivityAtRef.current = Date.now();
    mediaRecorderRef.current.resume();
    addLog("Aufnahme fortgesetzt");
  }, [addLog]);

  const secureContext = typeof window !== "undefined" ? window.isSecureContext : true;

  useEffect(() => {
    const check = () => {
      const s = getSettings();
      setMissingCredentials(!s.username?.trim() || !s.password?.trim());
    };
    check();
    if (typeof document === "undefined") {
      return;
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Recorder</h1>
            <div className="mt-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Modus
              </label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                value={mode}
                onChange={(event) => setMode(event.target.value)}
              >
                <option>2 Personen</option>
                <option>Diktat</option>
                <option>Team</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
              {status}
            </div>
            <Link
              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
              href="/Settings"
            >
              Settings
            </Link>
          </div>
        </div>

        {statusDetail ? (
          <p className="mt-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {statusDetail}
          </p>
        ) : null}

        {savedNotice ? (
          <p className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Gespeichert lokal. Upload startet automatisch.
          </p>
        ) : null}

        {missingCredentials ? (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Keine Zugangsdaten hinterlegt. Bitte zuerst{" "}
            <Link href="/Settings" className="font-semibold underline hover:text-amber-900">
              Benutzername und Passwort in den Settings eintragen
            </Link>
            , sonst koennen Aufnahmen nicht hochgeladen werden.
          </p>
        ) : null}

        {!secureContext ? (
          <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Hinweis: Mikrofonzugriff erfordert HTTPS oder localhost.
          </p>
        ) : null}

        <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
          Aufnahmen und Metadaten werden zuerst lokal auf diesem Geraet gespeichert. Uploads laufen erst nach Login und Geraetefreigabe gegen den konfigurierten Server.
        </p>

        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isRecording && !isPaused ? "bg-rose-500" : isPaused ? "bg-amber-400" : "bg-slate-300"
            }`}
          />
          <span>{isRecording ? (isPaused ? "Pausiert" : "Aufnahme laeuft") : "Bereit"}</span>
          <span className="font-mono text-slate-700">{formatDuration(elapsedSeconds)}</span>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm text-slate-600">
            Patient/ID (optional)
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="Patient/ID"
              value={patient}
              onChange={(event) => {
                setPatient(event.target.value);
                setHasAudioRecorded(false);
              }}
              type="text"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            DOB (optional)
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="Geburtsdatum"
              value={dob}
              onChange={(event) => {
                setDob(event.target.value);
                setHasAudioRecorded(false);
              }}
              type="text"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            Thema (optional)
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="Infusion ..."
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value);
                setHasAudioRecorded(false);
              }}
              type="text"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={startRecording}
            type="button"
            disabled={isRecording || isUploading}
          >
            Start
          </button>
          <button
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={isPaused ? resumeRecording : pauseRecording}
            type="button"
            disabled={!isRecording || isUploading}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            className="rounded-full border border-rose-300 px-5 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={stopRecording}
            type="button"
            disabled={!isRecording || isUploading}
          >
            Stop
          </button>
          <button
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={sendTextOnly}
            type="button"
            disabled={
              isRecording ||
              isUploading ||
              hasAudioRecorded ||
              (!patient.trim() && !dob.trim() && !topic.trim())
            }
          >
            Text Senden
          </button>
        </div>
      </div>

      <UploadQueue
        refreshToken={refreshToken}
        onRetry={attemptUpload}
        logs={logs}
        onLog={addLog}
      />
    </div>
  );
}
