"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULTS = {
  bpm: 5,
  duration: 15,
  minBpm: 3,
  maxBpm: 14,
  minDuration: 1,
  maxDuration: 30,
};

// Fixed sweep sequence from clinical reference (01-Vorgabe-Atmung-sweep-Lokal.pptx)
// 13 frequency steps, 80 breaths total, 12 -> 4 BPM, I:E ratio ~1:2
const SWEEP_STEPS = [
  { bpm: 12, breaths: 10, inhale: 1.7, exhale: 3.3 },
  { bpm: 11, breaths: 5, inhale: 1.8, exhale: 3.6 },
  { bpm: 10, breaths: 5, inhale: 2.0, exhale: 4.0 },
  { bpm: 9, breaths: 5, inhale: 2.2, exhale: 4.4 },
  { bpm: 8, breaths: 5, inhale: 2.5, exhale: 5.0 },
  { bpm: 7.5, breaths: 5, inhale: 2.7, exhale: 5.3 },
  { bpm: 7, breaths: 5, inhale: 2.9, exhale: 5.7 },
  { bpm: 6.7, breaths: 5, inhale: 3.0, exhale: 6.0 },
  { bpm: 6, breaths: 5, inhale: 3.3, exhale: 6.7 },
  { bpm: 5.5, breaths: 5, inhale: 3.7, exhale: 7.3 },
  { bpm: 5, breaths: 5, inhale: 4.0, exhale: 8.0 },
  { bpm: 4.5, breaths: 5, inhale: 4.4, exhale: 8.8 },
  { bpm: 4, breaths: 15, inhale: 5.0, exhale: 10.0 },
];

// Pre-compute flat array of all 80 breaths with cumulative start times
const SWEEP_BREATHS = [];
let _cumTime = 0;
for (const step of SWEEP_STEPS) {
  for (let i = 0; i < step.breaths; i++) {
    SWEEP_BREATHS.push({
      startTime: _cumTime,
      inhale: step.inhale,
      exhale: step.exhale,
      bpm: step.bpm,
    });
    _cumTime += step.inhale + step.exhale;
  }
}
const SWEEP_TOTAL_DURATION = _cumTime;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PyramidCanvas({ progress, phase, isRunning, canvasHeight = 220 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    // Pyramid dimensions - flat/wide triangle
    const padX = 30;
    const padTop = 40;
    const padBottom = 20;
    const baseY = H - padBottom;
    const peakY = padTop;
    const leftX = padX;
    const rightX = W - padX;
    const peakX = W / 2;

    // Draw pyramid outline
    ctx.beginPath();
    ctx.moveTo(leftX, baseY);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(rightX, baseY);
    ctx.closePath();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill pyramid with subtle gradient
    const grad = ctx.createLinearGradient(0, baseY, 0, peakY);
    grad.addColorStop(0, "rgba(0, 102, 204, 0.04)");
    grad.addColorStop(1, "rgba(0, 168, 107, 0.08)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Highlight active side
    if (isRunning) {
      ctx.beginPath();
      if (phase === "inhale") {
        ctx.moveTo(leftX, baseY);
        ctx.lineTo(peakX, peakY);
        ctx.strokeStyle = "rgba(0, 168, 107, 0.5)";
      } else {
        ctx.moveTo(peakX, peakY);
        ctx.lineTo(rightX, baseY);
        ctx.strokeStyle = "rgba(0, 102, 204, 0.5)";
      }
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Ball position
    let ballX, ballY;
    if (phase === "inhale") {
      ballX = leftX + (peakX - leftX) * progress;
      ballY = baseY + (peakY - baseY) * progress;
    } else {
      ballX = peakX + (rightX - peakX) * progress;
      ballY = peakY + (baseY - peakY) * progress;
    }

    // Ball shadow
    ctx.beginPath();
    ctx.arc(ballX, ballY + 2, 14, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fill();

    // Ball with gradient
    const ballGrad = ctx.createRadialGradient(ballX - 3, ballY - 3, 2, ballX, ballY, 14);
    if (phase === "inhale") {
      ballGrad.addColorStop(0, "#34d399");
      ballGrad.addColorStop(1, "#059669");
    } else {
      ballGrad.addColorStop(0, "#60a5fa");
      ballGrad.addColorStop(1, "#0066CC");
    }
    ctx.beginPath();
    ctx.arc(ballX, ballY, 12, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.fill();

    // Labels
    ctx.font = "13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#059669";
    ctx.fillText("Einatmen", (leftX + peakX) / 2, baseY + 16);
    ctx.fillStyle = "#0066CC";
    ctx.fillText("Ausatmen", (peakX + rightX) / 2, baseY + 16);
  }, [progress, phase, isRunning]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl border border-slate-200 bg-white"
      style={{ height: canvasHeight }}
    />
  );
}

export default function HrvAtemApp({ fullscreen = false }) {
  const [bpm, setBpm] = useState(DEFAULTS.bpm);
  const [duration, setDuration] = useState(DEFAULTS.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [easeInMode, setEaseInMode] = useState(false);
  const [isSweep, setIsSweep] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [phase, setPhase] = useState("inhale");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [currentBpm, setCurrentBpm] = useState(DEFAULTS.bpm);
  const [sweepBreathIdx, setSweepBreathIdx] = useState(0);
  const [showSettings, setShowSettings] = useState(fullscreen);

  const animRef = useRef(null);
  const startTimeRef = useRef(0);
  const elapsedBeforePauseRef = useRef(0);
  const lastPhaseRef = useRef("inhale");
  const synthRef = useRef(null);
  const spokenRef = useRef(false);
  const wakeLockRef = useRef(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    try {
      if (wakeLockRef.current) return;
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      wakeLockRef.current.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
    } catch {
      wakeLockRef.current = null;
    }
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

  // Cycle timing: 1/3 inhale, 2/3 exhale
  const getCycleDuration = useCallback((b) => 60 / b, []);
  const getInhaleDuration = useCallback((c) => c / 3, []);
  const getExhaleDuration = useCallback((c) => (c * 2) / 3, []);

  const speak = useCallback(
    (text) => {
      if (!voiceEnabled || typeof window === "undefined") return;
      if (!synthRef.current) synthRef.current = window.speechSynthesis;
      const synth = synthRef.current;
      if (!synth) return;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "de-DE";
      utter.rate = 0.8;
      utter.volume = 0.6;
      synth.speak(utter);
    },
    [voiceEnabled]
  );

  const stop = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    setPhase("inhale");
    setProgress(0);
    setElapsed(0);
    setSweepBreathIdx(0);
    elapsedBeforePauseRef.current = 0;
    lastPhaseRef.current = "inhale";
    spokenRef.current = false;
    if (synthRef.current) synthRef.current.cancel();
    releaseWakeLock();
  }, [releaseWakeLock]);

  // Main animation loop – uses a ref-based approach for stable references
  const bpmRef = useRef(bpm);
  const durationRef = useRef(duration);
  const easeInRef = useRef(easeInMode);
  const isSweepRef = useRef(isSweep);
  const voiceRef = useRef(voiceEnabled);
  bpmRef.current = bpm;
  durationRef.current = duration;
  easeInRef.current = easeInMode;
  isSweepRef.current = isSweep;
  voiceRef.current = voiceEnabled;

  const tick = useCallback(
    (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const totalElapsed =
        (timestamp - startTimeRef.current) / 1000 + elapsedBeforePauseRef.current;

      const totalDurationSec = isSweepRef.current
        ? SWEEP_TOTAL_DURATION
        : durationRef.current * 60;

      if (totalElapsed >= totalDurationSec) {
        stop();
        return;
      }

      setElapsed(Math.floor(totalElapsed));

      let newPhase, newProgress;

      if (isSweepRef.current) {
        // Sweep mode: look up exact breath from pre-computed table
        let breathIdx = 0;
        for (let i = SWEEP_BREATHS.length - 1; i >= 0; i--) {
          if (totalElapsed >= SWEEP_BREATHS[i].startTime) {
            breathIdx = i;
            break;
          }
        }

        const breath = SWEEP_BREATHS[breathIdx];
        const breathElapsed = totalElapsed - breath.startTime;

        setSweepBreathIdx(breathIdx);
        setCurrentBpm(breath.bpm);

        if (breathElapsed < breath.inhale) {
          newPhase = "inhale";
          newProgress = breathElapsed / breath.inhale;
        } else {
          newPhase = "exhale";
          newProgress = (breathElapsed - breath.inhale) / breath.exhale;
        }
      } else {
        // Normal or ease-in mode
        const activeBpm = easeInRef.current
          ? (() => {
              const totalSec = durationRef.current * 60;
              const startBpm = Math.min(DEFAULTS.maxBpm, Math.max(10, bpmRef.current * 2));
              const t = Math.min(totalElapsed / totalSec, 1);
              return startBpm + (bpmRef.current - startBpm) * Math.sqrt(t);
            })()
          : bpmRef.current;

        setCurrentBpm(Math.round(activeBpm * 10) / 10);

        const cycleDur = 60 / activeBpm;
        const inhaleDur = cycleDur / 3;
        const cyclePos = totalElapsed % cycleDur;

        if (cyclePos < inhaleDur) {
          newPhase = "inhale";
          newProgress = cyclePos / inhaleDur;
        } else {
          const exhaleDur = cycleDur - inhaleDur;
          newPhase = "exhale";
          newProgress = (cyclePos - inhaleDur) / exhaleDur;
        }
      }

      // Voice on phase change
      if (newPhase !== lastPhaseRef.current) {
        spokenRef.current = false;
        lastPhaseRef.current = newPhase;
      }
      if (!spokenRef.current && voiceRef.current) {
        const synth = window.speechSynthesis;
        if (synth) {
          synth.cancel();
          const utter = new SpeechSynthesisUtterance(
            newPhase === "inhale" ? "Einatmen" : "Ausatmen"
          );
          utter.lang = "de-DE";
          utter.rate = 0.8;
          utter.volume = 0.6;
          synth.speak(utter);
        }
        spokenRef.current = true;
      }

      setPhase(newPhase);
      setProgress(Math.min(newProgress, 1));

      animRef.current = requestAnimationFrame(tick);
    },
    [stop]
  );

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = 0;
    lastPhaseRef.current = "inhale";
    spokenRef.current = false;
    setSweepBreathIdx(0);
    if (isSweepRef.current) {
      setCurrentBpm(SWEEP_BREATHS[0].bpm);
    } else {
      setCurrentBpm(easeInRef.current ? Math.min(DEFAULTS.maxBpm, Math.max(10, bpmRef.current * 2)) : bpmRef.current);
    }
    animRef.current = requestAnimationFrame(tick);
    requestWakeLock();
  }, [tick, requestWakeLock]);

  const pause = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
    elapsedBeforePauseRef.current =
      (performance.now() - (startTimeRef.current || performance.now())) / 1000 +
      elapsedBeforePauseRef.current;
    startTimeRef.current = 0;
    setIsPaused(true);
    if (synthRef.current) synthRef.current.cancel();
    releaseWakeLock();
  }, [releaseWakeLock]);

  const resume = useCallback(() => {
    setIsPaused(false);
    startTimeRef.current = 0;
    animRef.current = requestAnimationFrame(tick);
    requestWakeLock();
  }, [tick, requestWakeLock]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (synthRef.current) synthRef.current.cancel();
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  // Display values
  const totalDurationSec = isSweep ? SWEEP_TOTAL_DURATION : duration * 60;
  const remainingSec = totalDurationSec - elapsed;

  // Inhale/exhale display: use sweep breath data when in sweep mode
  const sweepBreath = isSweep && sweepBreathIdx < SWEEP_BREATHS.length
    ? SWEEP_BREATHS[sweepBreathIdx]
    : null;
  const cycleDur = getCycleDuration(currentBpm);
  const inhaleSec = sweepBreath ? sweepBreath.inhale.toFixed(1) : getInhaleDuration(cycleDur).toFixed(1);
  const exhaleSec = sweepBreath ? sweepBreath.exhale.toFixed(1) : getExhaleDuration(cycleDur).toFixed(1);

  return (
    <div className={fullscreen ? "rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-md" : "my-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-md"}>
      {!fullscreen && (
        <h3 className="mb-1 font-heading text-lg font-semibold text-slate-900">
          HRV-Atemübung
        </h3>
      )}
      <p className={fullscreen ? "mb-3 text-sm text-slate-500" : "mb-4 text-sm text-slate-500"}>
        Folge der Kugel: links hoch = Einatmen, rechts runter = Ausatmen (1:2)
      </p>

      <PyramidCanvas progress={progress} phase={phase} isRunning={isRunning} canvasHeight={fullscreen ? 280 : 220} />

      {/* Phase indicator */}
      <div className="mt-3 flex items-center justify-center gap-4 text-sm">
        <span
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            phase === "inhale" && isRunning
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          Einatmen ({inhaleSec}s)
        </span>
        <span
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            phase === "exhale" && isRunning
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          Ausatmen ({exhaleSec}s)
        </span>
      </div>

      {/* Timer & BPM display */}
      {isRunning && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-slate-600">
          <span>
            Verbleibend: <strong>{formatTime(remainingSec > 0 ? remainingSec : 0)}</strong>
          </span>
          <span>
            Aktuell: <strong>{currentBpm.toFixed ? currentBpm.toFixed(1) : currentBpm}</strong> Atemzüge/min
          </span>
          {isSweep && (
            <span>
              Atemzug: <strong>{sweepBreathIdx + 1}</strong>/{SWEEP_BREATHS.length}
            </span>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {!isRunning ? (
          <button
            onClick={start}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-family-green"
          >
            {isSweep ? "Sweep starten" : "Start"}
          </button>
        ) : (
          <>
            {!isPaused ? (
              <button
                onClick={pause}
                className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary/40"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={resume}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-family-green"
              >
                Weiter
              </button>
            )}
            <button
              onClick={stop}
              className="rounded-full border border-red-200 bg-white px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Stopp
            </button>
          </>
        )}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-400"
        >
          Einstellungen {showSettings ? "\u25B2" : "\u25BC"}
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          {/* Sweep mode */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isSweep}
              onChange={(e) => {
                setIsSweep(e.target.checked);
                if (e.target.checked) setEaseInMode(false);
              }}
              disabled={isRunning}
              className="h-4 w-4 rounded border-slate-300 accent-primary"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Sweep-Modus</span>
              <p className="text-xs text-slate-500">
                Fester Ablauf: 12 &rarr; 4 Atemz&uuml;ge/min, 80 Atemz&uuml;ge, ~{formatTime(Math.round(SWEEP_TOTAL_DURATION))}
              </p>
            </div>
          </label>

          {/* Sweep frequency table */}
          {isSweep && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-medium text-slate-600">Frequenzverlauf:</p>
              <div className="flex flex-wrap gap-1.5">
                {SWEEP_STEPS.map((step, i) => (
                  <span
                    key={i}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      isRunning && sweepBreath && sweepBreath.bpm === step.bpm
                        ? "bg-primary text-white"
                        : "border border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {step.bpm}/min
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* BPM */}
          <div className={isSweep ? "opacity-40 pointer-events-none" : ""}>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Atemfrequenz: <strong>{bpm}</strong> pro Minute
            </label>
            <input
              type="range"
              min={DEFAULTS.minBpm}
              max={DEFAULTS.maxBpm}
              step={0.5}
              value={bpm}
              onChange={(e) => setBpm(parseFloat(e.target.value))}
              disabled={isRunning || isSweep}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{DEFAULTS.minBpm}/min</span>
              <span>{DEFAULTS.maxBpm}/min</span>
            </div>
          </div>

          {/* Duration */}
          <div className={isSweep ? "opacity-40 pointer-events-none" : ""}>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Dauer: <strong>{duration}</strong> Minuten
            </label>
            <input
              type="range"
              min={DEFAULTS.minDuration}
              max={DEFAULTS.maxDuration}
              step={1}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              disabled={isRunning || isSweep}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{DEFAULTS.minDuration} min</span>
              <span>{DEFAULTS.maxDuration} min</span>
            </div>
          </div>

          {/* Ease-in mode */}
          <label className={`flex cursor-pointer items-center gap-3 ${isSweep ? "opacity-40 pointer-events-none" : ""}`}>
            <input
              type="checkbox"
              checked={easeInMode}
              onChange={(e) => setEaseInMode(e.target.checked)}
              disabled={isRunning || isSweep}
              className="h-4 w-4 rounded border-slate-300 accent-primary"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Eingewöhnungsmodus</span>
              <p className="text-xs text-slate-500">
                Startet schnell und wird langsam bis zur Zielfrequenz
              </p>
            </div>
          </label>

          {/* Voice guidance */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-primary"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Sprachansage</span>
              <p className="text-xs text-slate-500">
                Ruhige Ansage &quot;Einatmen&quot; / &quot;Ausatmen&quot;
              </p>
            </div>
          </label>

          {/* Presets */}
          <div className={isSweep ? "opacity-40 pointer-events-none" : ""}>
            <p className="mb-2 text-sm font-medium text-slate-700">Schnellwahl:</p>
            <div className="flex flex-wrap gap-2">
              {[4, 4.5, 5, 5.5, 6, 7, 8].map((v) => (
                <button
                  key={v}
                  onClick={() => setBpm(v)}
                  disabled={isRunning || isSweep}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    bpm === v
                      ? "bg-primary text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-primary/40"
                  }`}
                >
                  {v}/min
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
