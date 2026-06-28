import { create } from "zustand";
import type { ScheduleBlock } from "../types/schedule";
import { BLOCK_COLORS } from "../utils/colors";
import { DAY_MINUTES } from "../utils/time";

export const STORAGE_KEY = "daily-planner-schedule-blocks";
const DAY_KEY = "daily-planner-active-day";
const SUMMARY_KEY = "daily-planner-yesterday-summary";
const SUMMARY_SEEN_KEY = "daily-planner-summary-seen";
export const ALARM_KEY = "daily-planner-alarm-enabled";

export type DailySummary = {
  day: string;
  completed: number;
  total: number;
  completedTitles: string[];
};

/** A Timepick day starts at 06:00 in the device's local timezone. */
export function getTimepickDay(date = new Date()) {
  const shifted = new Date(date);
  shifted.setHours(shifted.getHours() - 6);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(shifted.getDate()).padStart(2, "0")}`;
}

function storageGet(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function storageSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* unavailable storage */ }
}

function saveBlocks(blocks: ScheduleBlock[]) {
  storageSet(STORAGE_KEY, JSON.stringify(blocks));
}

function loadBlocksFromStorage(): ScheduleBlock[] {
  try {
    const saved = storageGet(STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value, index) => {
      if (typeof value !== "object" || value === null || !("id" in value) || !("title" in value) || !("startMinute" in value) || !("endMinute" in value) || !("isDone" in value) || typeof value.id !== "string" || typeof value.title !== "string" || typeof value.startMinute !== "number" || typeof value.endMinute !== "number" || typeof value.isDone !== "boolean" || value.startMinute < 0 || value.endMinute > DAY_MINUTES || value.startMinute >= value.endMinute) return [];
      const color = "color" in value && typeof value.color === "string" && BLOCK_COLORS.includes(value.color as ScheduleBlock["color"]) ? value.color as ScheduleBlock["color"] : BLOCK_COLORS[index % BLOCK_COLORS.length];
      return [{ ...value, color } as ScheduleBlock];
    });
  } catch { return []; }
}

function loadSummary(): DailySummary | null {
  try {
    const value: unknown = JSON.parse(storageGet(SUMMARY_KEY) ?? "null");
    if (!value || typeof value !== "object" || !("day" in value) || !("completed" in value) || !("total" in value) || !("completedTitles" in value) || typeof value.day !== "string" || typeof value.completed !== "number" || typeof value.total !== "number" || !Array.isArray(value.completedTitles)) return null;
    return value as DailySummary;
  } catch { return null; }
}

type ScheduleState = {
  scheduleBlocks: ScheduleBlock[];
  draftBlocks: ScheduleBlock[];
  yesterdaySummary: DailySummary | null;
  alarmEnabled: boolean;
  beginEdit: () => void;
  addDraft: (block: ScheduleBlock) => void;
  updateDraft: (id: string, updates: Pick<ScheduleBlock, "title" | "color" | "startMinute" | "endMinute">) => void;
  removeDraft: (id: string) => void;
  clearDraft: () => void;
  commitDraft: () => void;
  toggleDone: (id: string) => void;
  loadBlocks: () => void;
  checkDailyReset: () => void;
  dismissSummary: () => void;
  setAlarmEnabled: (enabled: boolean) => void;
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  scheduleBlocks: [], draftBlocks: [], yesterdaySummary: null, alarmEnabled: storageGet(ALARM_KEY) === "true",
  beginEdit: () => set((state) => ({ draftBlocks: state.scheduleBlocks.map((block) => ({ ...block })) })),
  addDraft: (block) => set((state) => ({ draftBlocks: [...state.draftBlocks, block] })),
  updateDraft: (id, updates) => set((state) => ({ draftBlocks: state.draftBlocks.map((block) => block.id === id ? { ...block, ...updates } : block) })),
  removeDraft: (id) => set((state) => ({ draftBlocks: state.draftBlocks.filter((block) => block.id !== id) })),
  clearDraft: () => set({ draftBlocks: [] }),
  commitDraft: () => { const blocks = get().draftBlocks.map((block) => ({ ...block })); set({ scheduleBlocks: blocks }); saveBlocks(blocks); },
  toggleDone: (id) => { const blocks = get().scheduleBlocks.map((block) => block.id === id ? { ...block, isDone: !block.isDone } : block); set({ scheduleBlocks: blocks }); saveBlocks(blocks); },
  loadBlocks: () => {
    const blocks = loadBlocksFromStorage();
    set({ scheduleBlocks: blocks });
    get().checkDailyReset();
  },
  checkDailyReset: () => {
    const currentDay = getTimepickDay();
    const storedDay = storageGet(DAY_KEY);
    if (!storedDay) { storageSet(DAY_KEY, currentDay); return; }
    if (storedDay === currentDay) return;
    const previous = get().scheduleBlocks;
    const summary: DailySummary = { day: storedDay, completed: previous.filter((block) => block.isDone).length, total: previous.length, completedTitles: previous.filter((block) => block.isDone).map((block) => block.title) };
    const reset = previous.map((block) => ({ ...block, isDone: false }));
    storageSet(SUMMARY_KEY, JSON.stringify(summary)); storageSet(DAY_KEY, currentDay); saveBlocks(reset);
    set({ scheduleBlocks: reset, yesterdaySummary: summary });
  },
  dismissSummary: () => { const summary = get().yesterdaySummary; if (summary) storageSet(SUMMARY_SEEN_KEY, summary.day); set({ yesterdaySummary: null }); },
  setAlarmEnabled: (enabled) => { storageSet(ALARM_KEY, String(enabled)); set({ alarmEnabled: enabled }); },
}));

// Restore an unseen summary even when the page was closed immediately after reset.
const summary = loadSummary();
if (summary && storageGet(SUMMARY_SEEN_KEY) !== summary.day) useScheduleStore.setState({ yesterdaySummary: summary });
