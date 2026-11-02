const STORAGE_KEY = "recorderSettings";
const TOKEN_KEY = "recorderToken";

// No default backend: the endpoint is entered in /Settings/ and kept in
// localStorage. Shipping a fixed URL in the bundle advertised the login
// endpoint to anyone reading the JavaScript, for no benefit — existing
// installs already have their value stored.
const defaultSettings = {
  baseUrl: "",
  targetSampleRate: "",
  username: "",
  password: "",
  deviceId: "",
};

function generateDeviceId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function migrateSettings(parsed) {
  if (parsed.webhookUrl && !parsed.baseUrl) {
    const { webhookUrl, ...rest } = parsed;
    return rest;
  }
  return parsed;
}

export function getSettings() {
  if (typeof window === "undefined") {
    return { ...defaultSettings };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = { ...defaultSettings, deviceId: generateDeviceId() };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = migrateSettings(JSON.parse(raw));
    const merged = { ...defaultSettings, ...parsed };
    if (!merged.deviceId) {
      merged.deviceId = generateDeviceId();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return { ...defaultSettings };
  }
}

export function setSettings(nextSettings) {
  if (typeof window === "undefined") {
    return;
  }
  const merged = { ...defaultSettings, ...nextSettings };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.access_token || !parsed.stored_at) {
      return null;
    }
    const ageMs = Date.now() - parsed.stored_at;
    const maxAgeMs = 7.5 * 60 * 60 * 1000;
    if (ageMs > maxAgeMs) {
      window.localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return parsed.access_token;
  } catch {
    return null;
  }
}

export function setToken(accessToken) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({ access_token: accessToken, stored_at: Date.now() })
  );
}

export function clearToken() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * Loescht alles, was dieses Werkzeug auf dem Geraet abgelegt hat — und zwar die
 * BEIDEN localStorage-Schluessel, nicht nur die Einstellungen.
 *
 * Eingefuehrt mit dem Nachaudit vom 02.11.2026 (F08): es gab keinen Weg,
 * Zugangsdaten und Geraete-Kennung gezielt wieder loszuwerden, ausser die
 * Browserdaten der ganzen Seite zu leeren.
 *
 * Gibt zurueck, WAS geloescht wurde und was danach noch da ist. Ein Loeschknopf,
 * der nur "fertig" sagt, sieht im Fehlerfall genauso aus wie im Erfolgsfall;
 * die Settings-Ansicht zeigt deshalb die Nachmessung an.
 *
 * ACHTUNG beim Pruefen: `uebrig` ist nur fuer den Augenblick direkt nach dem
 * Entfernen aussagekraeftig. Der naechste getSettings()-Aufruf — und den loest
 * schon das naechste Rendern aus — legt STORAGE_KEY sofort wieder an, mit leeren
 * Feldern und einer NEUEN Geraete-Kennung. Der Abnahmetest vom 02.11.2026 hat
 * genau das gezeigt: das Werkzeug meldete "keine Eintraege mehr", waehrend der
 * Schluessel schon wieder existierte. Wer hier prueft, prueft die WERTE
 * (baseUrl/username/password leer, Kennung veraendert), nicht die Anwesenheit
 * des Schluessels.
 */
export function clearLocalSettings() {
  if (typeof window === "undefined") {
    return { geloescht: [], uebrig: [] };
  }
  const geloescht = [];
  for (const key of [STORAGE_KEY, TOKEN_KEY]) {
    if (window.localStorage.getItem(key) !== null) {
      geloescht.push(key);
    }
    window.localStorage.removeItem(key);
  }
  const uebrig = [STORAGE_KEY, TOKEN_KEY].filter(
    (key) => window.localStorage.getItem(key) !== null
  );
  return { geloescht, uebrig };
}

export { defaultSettings, STORAGE_KEY, TOKEN_KEY };
