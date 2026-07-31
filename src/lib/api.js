import { getToken, setToken, clearToken } from "./storage";

async function login(baseUrl, username, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let detail = "";
    try {
      detail = JSON.parse(text).detail || text;
    } catch {
      detail = text;
    }
    throw new Error(
      response.status === 401
        ? `Login fehlgeschlagen: Ungueltige Zugangsdaten.`
        : `Login fehlgeschlagen (${response.status}). ${detail}`
    );
  }

  const data = await response.json();
  setToken(data.access_token);
  return data.access_token;
}

async function ensureToken(settings) {
  const existing = getToken();
  if (existing) {
    return existing;
  }
  const { baseUrl, username, password } = settings;
  if (!baseUrl) {
    throw new Error("Server-Adresse fehlt. Bitte in Settings konfigurieren.");
  }
  if (!username || !password) {
    throw new Error("Login-Daten fehlen. Bitte in Settings konfigurieren.");
  }
  return login(baseUrl, username, password);
}

async function authenticatedUpload(url, formData, token, deviceId) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Device-ID": deviceId,
    },
    body: formData,
  });

  if (response.status === 401) {
    clearToken();
    const error = new Error("Token abgelaufen. Erneuter Login wird versucht.");
    error.retryAuth = true;
    throw error;
  }

  if (response.status === 403) {
    const text = await response.text().catch(() => "");
    let detail = "";
    try {
      detail = JSON.parse(text).detail || text;
    } catch {
      detail = text;
    }
    const isDeviceApproval =
      /not yet approved|nicht.*freigegeben/i.test(detail);
    const message = isDeviceApproval
      ? "Geraet noch nicht freigegeben. Admin wurde benachrichtigt."
      : `Zugriff verweigert (403). ${detail}`;
    const error = new Error(message);
    error.devicePending = isDeviceApproval;
    throw error;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const detail = text ? ` ${text}` : "";
    throw new Error(`Upload fehlgeschlagen (${response.status}).${detail}`);
  }

  return response;
}

export async function uploadRecording(recording, settings) {
  const { baseUrl, targetSampleRate, deviceId } = settings;
  if (!baseUrl) {
    throw new Error("Server-URL fehlt.");
  }
  if (!deviceId) {
    throw new Error("Device-ID fehlt. Bitte Settings pruefen.");
  }

  const formData = new FormData();
  const filename =
    recording.filename || `recording-${recording.id || "unknown"}.webm`;
  const blobType = recording.blob?.type || "audio/webm";
  const file = new File([recording.blob], filename, { type: blobType });

  formData.append("file", file);
  formData.append("patient", recording.patient || "");
  formData.append("dob", recording.dob || "");
  formData.append("topic", recording.topic || "");
  formData.append(
    "clientTimestamp",
    recording.createdAt || new Date().toISOString()
  );
  const targetSampleRateValue = String(targetSampleRate || "").trim();
  const resolvedSampleRate =
    targetSampleRateValue && !Number.isNaN(Number(targetSampleRateValue))
      ? String(Number(targetSampleRateValue))
      : "";
  formData.append("targetSampleRate", resolvedSampleRate);

  const uploadUrl = `${baseUrl}/api/audio-upload`;

  let token = await ensureToken(settings);
  try {
    return await authenticatedUpload(uploadUrl, formData, token, deviceId);
  } catch (error) {
    if (error.retryAuth) {
      token = await login(baseUrl, settings.username, settings.password);
      return authenticatedUpload(uploadUrl, formData, token, deviceId);
    }
    throw error;
  }
}

export async function uploadTextOnly(payload, settings) {
  const { baseUrl, targetSampleRate, deviceId } = settings;
  if (!baseUrl) {
    throw new Error("Server-URL fehlt.");
  }
  if (!deviceId) {
    throw new Error("Device-ID fehlt. Bitte Settings pruefen.");
  }

  const formData = new FormData();
  formData.append("patient", payload.patient || "");
  formData.append("dob", payload.dob || "");
  formData.append("topic", payload.topic || "");
  formData.append(
    "clientTimestamp",
    payload.createdAt || new Date().toISOString()
  );
  const targetSampleRateValue = String(targetSampleRate || "").trim();
  const resolvedSampleRate =
    targetSampleRateValue && !Number.isNaN(Number(targetSampleRateValue))
      ? String(Number(targetSampleRateValue))
      : "";
  formData.append("targetSampleRate", resolvedSampleRate);

  const uploadUrl = `${baseUrl}/api/audio-upload`;

  let token = await ensureToken(settings);
  try {
    return await authenticatedUpload(uploadUrl, formData, token, deviceId);
  } catch (error) {
    if (error.retryAuth) {
      token = await login(baseUrl, settings.username, settings.password);
      return authenticatedUpload(uploadUrl, formData, token, deviceId);
    }
    throw error;
  }
}

export async function testLogin(settings) {
  const { baseUrl, username, password } = settings;
  if (!baseUrl) {
    throw new Error("Server-URL fehlt.");
  }
  if (!username || !password) {
    throw new Error("Benutzername und Passwort erforderlich.");
  }
  await login(baseUrl, username, password);
}
