import { openDB } from "idb";

const DB_NAME = "recorder-db";
const DB_VERSION = 2;
const STORE_NAME = "recordings";

let dbPromise = null;

function getDbPromise() {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        let store;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
        } else {
          store = transaction.objectStore(STORE_NAME);
        }
        if (!store.indexNames.contains("uploaded")) {
          store.createIndex("uploaded", "uploaded");
        }
        if (!store.indexNames.contains("createdAt")) {
          store.createIndex("createdAt", "createdAt");
        }
      },
    });
  }
  return dbPromise;
}

async function requireDb() {
  const promise = getDbPromise();
  if (!promise) {
    throw new Error("IndexedDB unavailable in this environment.");
  }
  return promise;
}

export async function saveRecording(blob, meta) {
  const db = await requireDb();
  const record = {
    createdAt: meta.createdAt,
    filename: meta.filename,
    blob,
    uploaded: false,
    type: meta.type || "audio",
    patient: meta.patient || "",
    dob: meta.dob || "",
    topic: meta.topic || "",
  };
  return db.add(STORE_NAME, record);
}

export async function saveTextEntry(meta) {
  const db = await requireDb();
  const record = {
    createdAt: meta.createdAt,
    filename: meta.filename,
    blob: null,
    uploaded: false,
    type: "text",
    patient: meta.patient || "",
    dob: meta.dob || "",
    topic: meta.topic || "",
  };
  return db.add(STORE_NAME, record);
}

export async function getPendingUploads() {
  const db = await requireDb();
  let records = [];
  try {
    records = await db.getAllFromIndex(STORE_NAME, "uploaded", false);
  } catch (error) {
    const all = await db.getAll(STORE_NAME);
    records = all.filter((record) => record.uploaded === false);
  }
  return records.sort((a, b) => {
    const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return left - right;
  });
}

export async function markAsUploaded(id) {
  const db = await requireDb();
  const record = await db.get(STORE_NAME, id);
  if (!record) {
    return;
  }
  record.uploaded = true;
  await db.put(STORE_NAME, record);
}

export async function deleteRecording(id) {
  const db = await requireDb();
  await db.delete(STORE_NAME, id);
}
