export const DAY_MINUTES = 1440;
export const SLOT_MINUTES = 10;
export const SLOT_COUNT = DAY_MINUTES / SLOT_MINUTES;
export const EDIT_SLOT_HEIGHT = 20;
export const MAIN_SLOT_HEIGHT = 20;

export function formatTime(minute: number) {
  const total = Math.floor(minute + 6 * 60) % DAY_MINUTES;
  const hour = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatRange(startMinute: number, endMinute: number) {
  return `${formatTime(startMinute)} - ${formatTime(endMinute)}`;
}

export function getCurrentTimelineMinute(date = new Date()) {
  const minute =
    date.getHours() * 60 +
    date.getMinutes() +
    date.getSeconds() / 60 -
    6 * 60;

  return minute < 0 ? minute + DAY_MINUTES : minute;
}

export function blocksOverlap(
  startMinute: number,
  endMinute: number,
  blocks: { startMinute: number; endMinute: number }[],
  excludedId?: string,
) {
  return blocks.some(
    (block) =>
      block !== undefined &&
      ("id" in block ? block.id !== excludedId : true) &&
      startMinute < block.endMinute &&
      endMinute > block.startMinute,
  );
}
