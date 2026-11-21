import { get, set, del } from "idb-keyval";
import type { Transaction } from "./types";

const KEY = "aft:transactions:v1";
const SETTINGS_KEY = "aft:settings:v1";

export interface Settings {
  currency: string;
}

export const DEFAULT_SETTINGS: Settings = { currency: "USD" };

/** IndexedDB first (idb-keyval), localStorage as a fallback. Everything stays on-device. */
async function read<T>(key: string): Promise<T | undefined> {
  try {
    const v = await get<T>(key);
    if (v !== undefined) return v;
  } catch {
    /* IndexedDB unavailable (private mode etc.) */
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

async function write<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value);
    return;
  } catch {
    /* fall through */
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
}

export const loadTransactions = async () => (await read<Transaction[]>(KEY)) ?? [];
export const saveTransactions = (t: Transaction[]) => write(KEY, t);
export const loadSettings = async () => ({ ...DEFAULT_SETTINGS, ...((await read<Settings>(SETTINGS_KEY)) ?? {}) });
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s);

export async function clearAll() {
  try {
    await del(KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
