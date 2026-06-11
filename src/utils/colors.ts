import type { BlockColor, ScheduleBlock } from "../types/schedule";

export const BLOCK_COLORS: BlockColor[] = [
  "blue",
  "green",
  "purple",
  "yellow",
  "pink",
  "teal",
  "orange",
  "gray",
];

export const BLOCK_COLOR_OPTIONS: { color: BlockColor; label: string }[] = [
  { color: "blue", label: "파랑" },
  { color: "green", label: "초록" },
  { color: "purple", label: "보라" },
  { color: "yellow", label: "노랑" },
  { color: "pink", label: "분홍" },
  { color: "teal", label: "청록" },
  { color: "orange", label: "주황" },
  { color: "gray", label: "회색" },
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
