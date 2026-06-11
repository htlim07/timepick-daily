import { create } from "zustand";
import type { ScheduleBlock } from "../types/schedule";
import { BLOCK_COLORS } from "../utils/colors";
import { DAY_MINUTES } from "../utils/time";

export const STORAGE_KEY = "daily-planner-schedule-blocks";

function saveBlocks(blocks: ScheduleBlock[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
  } catch {
    // Storage can be unavailable in private browsing or restricted environments.
  }
}

function loadBlocksFromStorage(): ScheduleBlock[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((value, index) => {
      if (
        typeof value !== "object" ||
        value === null ||
        !("id" in value) ||
        !("title" in value) ||
        !("startMinute" in value) ||
        !("endMinute" in value) ||
        !("isDone" in value) ||
        typeof value.id !== "string" ||
        typeof value.title !== "string" ||
        typeof value.startMinute !== "number" ||
        typeof value.endMinute !== "number" ||
        typeof value.isDone !== "boolean" ||
        value.startMinute < 0 ||
        value.endMinute > DAY_MINUTES ||
        value.startMinute >= value.endMinute
      ) {
        return [];
      }

      const color =
        "color" in value &&
        typeof value.color === "string" &&
        BLOCK_COLORS.includes(value.color as ScheduleBlock["color"])
          ? (value.color as ScheduleBlock["color"])
          : BLOCK_COLORS[index % BLOCK_COLORS.length];

      return [{ ...value, color } as ScheduleBlock];
    });
  } catch {
    return [];
  }
}

type ScheduleState = {
  scheduleBlocks: ScheduleBlock[];
  draftBlocks: ScheduleBlock[];
  beginEdit: () => void;
  addDraft: (block: ScheduleBlock) => void;
  updateDraft: (id: string, title: string) => void;
  removeDraft: (id: string) => void;
  commitDraft: () => void;
  toggleDone: (id: string) => void;
  loadBlocks: () => void;
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  scheduleBlocks: [],
  draftBlocks: [],
  beginEdit: () =>
    set((state) => ({
      draftBlocks: state.scheduleBlocks.map((block) => ({ ...block })),
    })),
  addDraft: (block) =>
    set((state) => ({ draftBlocks: [...state.draftBlocks, block] })),
  updateDraft: (id, title) =>
    set((state) => ({
      draftBlocks: state.draftBlocks.map((block) =>
        block.id === id ? { ...block, title } : block,
      ),
    })),
  removeDraft: (id) =>
    set((state) => ({
      draftBlocks: state.draftBlocks.filter((block) => block.id !== id),
    })),
  commitDraft: () => {
    const blocks = get().draftBlocks.map((block) => ({ ...block }));
    set({ scheduleBlocks: blocks });
    saveBlocks(blocks);
  },
  toggleDone: (id) => {
    const blocks = get().scheduleBlocks.map((block) =>
        block.id === id ? { ...block, isDone: !block.isDone } : block,
    );
    set({ scheduleBlocks: blocks });
    saveBlocks(blocks);
  },
  loadBlocks: () => set({ scheduleBlocks: loadBlocksFromStorage() }),
}));
