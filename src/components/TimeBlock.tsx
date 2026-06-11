import { useEffect, useRef, useState } from "react";
import type { ScheduleBlock } from "../types/schedule";
import { EDIT_SLOT_HEIGHT, formatRange, MAIN_SLOT_HEIGHT, SLOT_MINUTES } from "../utils/time";

type TimeBlockProps = {
  block: ScheduleBlock;
  mode: "main" | "edit";
  isCurrent?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
};

export const CANCEL_BLOCK_LONG_PRESS_EVENT = "timeline-cancel-block-long-press";
const TAP_MOVE_THRESHOLD = 8;

export function TimeBlock({ block, mode, isCurrent = false, onClick, onEdit }: TimeBlockProps) {
  const longPressTimer = useRef<number | null>(null);
  const tooltipTimer = useRef<number | null>(null);
  const didLongPress = useRef(false);
  const tapPointerRef = useRef<number | null>(null);
  const tapStartRef = useRef({ x: 0, y: 0 });
  const tapCancelledRef = useRef(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const duration = block.endMinute - block.startMinute;
  const size = duration < 30 ? "compact" : "full";
  const showTimeInside = duration >= 40;
  const slotHeight = mode === "edit" ? EDIT_SLOT_HEIGHT : MAIN_SLOT_HEIGHT;
  const top =
    (block.startMinute / SLOT_MINUTES) * slotHeight;
  const height =
    ((block.endMinute - block.startMinute) / SLOT_MINUTES) * slotHeight;

  const cancelLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const cancelTap = () => {
    tapCancelledRef.current = true;
    tapPointerRef.current = null;
    cancelLongPress();
  };

  useEffect(() => {
    const handleCancelTap = () => {
      tapCancelledRef.current = true;
      tapPointerRef.current = null;
      if (longPressTimer.current !== null) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    window.addEventListener(CANCEL_BLOCK_LONG_PRESS_EVENT, handleCancelTap);
    return () => window.removeEventListener(CANCEL_BLOCK_LONG_PRESS_EVENT, handleCancelTap);
  }, []);

  const showMobileTooltip = () => {
    setShowTooltip(true);
    if (tooltipTimer.current !== null) window.clearTimeout(tooltipTimer.current);
    tooltipTimer.current = window.setTimeout(() => setShowTooltip(false), 2600);
  };

  return (
    <div
      className={`time-block-position tooltip-${block.endMinute > 1320 ? "above" : "below"} ${showTooltip ? "show-tooltip" : ""}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
      }}
    >
      <button
        type="button"
        aria-label={`${block.title}, ${formatRange(block.startMinute, block.endMinute)}`}
        className={`time-block time-block-${mode} time-block-${size} ${block.isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}
        style={{ backgroundColor: `var(--block-${block.color})` }}
        onClick={() => {
          if (didLongPress.current) {
            didLongPress.current = false;
            return;
          }
          if (mode === "main") onClick?.();
        }}
        onContextMenu={(event) => {
          if (mode === "edit") {
            event.preventDefault();
            onEdit?.();
          }
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "touch") event.stopPropagation();

          if (mode === "edit" && event.pointerType === "touch") {
            tapPointerRef.current = event.pointerId;
            tapStartRef.current = { x: event.clientX, y: event.clientY };
            tapCancelledRef.current = false;
            return;
          }

          longPressTimer.current = window.setTimeout(() => {
            didLongPress.current = true;
            showMobileTooltip();
          }, 550);
        }}
        onPointerUp={(event) => {
          if (mode === "edit" && event.pointerType === "touch") {
            const shouldEdit =
              tapPointerRef.current === event.pointerId && !tapCancelledRef.current;
            cancelTap();
            if (shouldEdit) onEdit?.();
            return;
          }
          cancelLongPress();
        }}
        onPointerCancel={cancelTap}
        onPointerMove={(event) => {
          if (mode === "edit" && tapPointerRef.current === event.pointerId) {
            const distance = Math.hypot(
              event.clientX - tapStartRef.current.x,
              event.clientY - tapStartRef.current.y,
            );
            if (distance > TAP_MOVE_THRESHOLD) cancelTap();
            return;
          }
          cancelLongPress();
        }}
      >
        <strong>{block.title}</strong>
        {showTimeInside && (
          <span className="block-time">{formatRange(block.startMinute, block.endMinute)}</span>
        )}
        {mode === "main" && (
          <span className="check-mark">{block.isDone ? "✓" : ""}</span>
        )}
        {isCurrent && <span className="current-badge">지금</span>}
      </button>
      <span className="time-block-tooltip" role="tooltip">
        <strong>{block.title}</strong>
        <span>{formatRange(block.startMinute, block.endMinute)}</span>
      </span>
    </div>
  );
}
