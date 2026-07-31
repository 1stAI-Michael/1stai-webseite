"use client";

import { useState } from "react";
import Link from "next/link";
import { defaultSettings, getSettings, setSettings, clearToken } from "../../lib/storage";
import { testLogin } from "../../lib/api";

export default function Settings() {
  const current = getSettings();
  const [baseUrl, setBaseUrl] = useState(current.baseUrl);
  const [targetSampleRate, setTargetSampleRate] = useState(current.targetSampleRate);
  const [username, setUsername] = useState(current.username || "");
  const [password, setPassword] = useState(current.password || "");
  const [saved, setSaved] = useState(false);
  const [loginStatus, setLoginStatus] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const deviceId = current.deviceId;

  const handleSave = () => {
    setSettings({
      baseUrl: baseUrl.trim() || defaultSettings.baseUrl,
      targetSampleRate: targetSampleRate.trim(),
      username: username.trim(),
      password: password,
      deviceId: deviceId,
    });
    clearToken();
    setSaved(true);
    setLoginStatus("");
    setLoginError("");
    window.setTimeout(() => setSaved(false), 2000);
  };

  const handleTestLogin = async () => {
    setLoginBusy(true);
    setLoginStatus("");
    setLoginError("");
    try {
      await testLogin({
        baseUrl: baseUrl.trim() || defaultSettings.baseUrl,
        username: username.trim(),
        password: password,
      });
      setLoginStatus("Login erfolgreich");
    } catch (error) {
      setLoginError(error?.message || "Login fehlgeschlagen.");
    } finally {
      setLoginBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Recorder Settings</h1>
            <p className="text-sm text-slate-500">Server-Verbindung, Login und Device-ID fuer Uploads.</p>
          </div>
          <div className="flex items-center gap-2">
            {saved ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Gespeichert
              </span>
            ) : null}
            <Link
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
              href="/Recorder"
            >
              Recorder
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm text-slate-600">
            Benutzername
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Benutzername"
              type="text"
              autoComplete="username"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            Passwort
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Passwort"
              type="password"
              autoComplete="current-password"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            Server URL
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder={defaultSettings.baseUrl}
              type="url"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            Sample Rate (Ziel)
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-400 focus:outline-none"
              value={targetSampleRate}
              onChange={(event) => setTargetSampleRate(event.target.value)}
              placeholder="auto"
              inputMode="numeric"
              type="text"
            />
          </label>
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
            Zugangsdaten und Device-ID werden nur lokal im Browser gespeichert. Eine neue Domain oder ein neues Handy erzeugt eine neue Device-ID, die einmalig freigegeben werden muss.
          </p>
          <div className="grid gap-2 text-sm text-slate-600">
            <span>Device ID</span>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500 select-all">
              {deviceId || "wird beim Speichern erzeugt"}
            </div>
            <p className="text-xs text-slate-400">
              Wird automatisch erzeugt. Muss vom Admin einmalig freigegeben werden.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={handleSave}
            type="button"
          >
            Speichern
          </button>
          <button
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleTestLogin}
            type="button"
            disabled={loginBusy || !username.trim() || !password}
          >
            {loginBusy ? "Login..." : "Login testen"}
          </button>
        </div>

        {loginStatus ? (
          <p className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {loginStatus}
          </p>
        ) : null}
        {loginError ? (
          <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {loginError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
