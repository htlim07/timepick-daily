import type { BlockColor, ScheduleBlock } from "../types/schedule";

export const BLOCK_COLORS: BlockColor[] = [
  "blue",
  "green",
  "purple",
  "orange",
  "pink",
  "teal",
];

export function getNextBlockColor(
  blocks: ScheduleBlock[],
  startMinute: number,
  endMinute: number,
): BlockColor {
  const adjacentColors = new Set(
    blocks
      .filter(
        (block) =>
          block.endMinute === startMinute ||
          block.startMinute === endMinute,
      )
      .map((block) => block.color),
  );

  const startIndex = blocks.length % BLOCK_COLORS.length;

  for (let offset = 0; offset < BLOCK_COLORS.length; offset += 1) {
    const color = BLOCK_COLORS[(startIndex + offset) % BLOCK_COLORS.length];
    if (!adjacentColors.has(color)) return color;
  }

  return BLOCK_COLORS[startIndex];
}
