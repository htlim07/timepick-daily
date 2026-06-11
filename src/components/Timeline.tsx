import { useEffect, useRef, useState } from "react";
import type { ScheduleBlock } from "../types/schedule";
import {
  blocksOverlap,
  EDIT_SLOT_HEIGHT,
  formatTime,
  getCurrentTimelineMinute,
  MAIN_SLOT_HEIGHT,
  SLOT_COUNT,
  SLOT_MINUTES,
} from "../utils/time";
import { CANCEL_BLOCK_LONG_PRESS_EVENT, TimeBlock } from "./TimeBlock";

type TimelineProps = {
  blocks: ScheduleBlock[];
  mode: "main" | "edit";
  onToggle?: (id: string) => void;
  onCreate?: (startMinute: number, endMinute: number) => void;
  onEdit?: (block: ScheduleBlock) => void;
  onOverlap?: () => void;
};

type Selection = {
  startIndex: number;
  endIndex: number;
};

const slots = Array.from({ length: SLOT_COUNT }, (_, index) => index);
const EDGE_THRESHOLD = 80;
const MAX_SCROLL_SPEED = 12;

export function Timeline({
  blocks,
  mode,
  onToggle,
  onCreate,
  onEdit,
  onOverlap,
}: TimelineProps) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [currentMinute, setCurrentMinute] = useState(() => getCurrentTimelineMinute());
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Selection | null>(null);
  const selectionStartRef = useRef<number | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const pointerYRef = useRef(0);
  const selectionCancelledRef = useRef(false);
  const autoScrollFrameRef = useRef<number | null>(null);
  const touchPointersRef = useRef(new Map<number, number>());
  const twoFingerCenterYRef = useRef<number | null>(null);
  const isTwoFingerGestureRef = useRef(false);

  useEffect(() => {
    if (mode !== "main") return;

    const updateCurrentTime = () => setCurrentMinute(getCurrentTimelineMinute());
    const timer = window.setInterval(updateCurrentTime, 1000);
    return () => window.clearInterval(timer);
  }, [mode]);

  useEffect(() => () => {
    if (autoScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(autoScrollFrameRef.current);
    }
  }, []);

  useEffect(() => {
    if (mode !== "main") return;

    const timer = window.setTimeout(() => {
      currentLineRef.current?.scrollIntoView({ block: "center" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [mode]);

  const slotFromPointer = (clientY: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(SLOT_COUNT - 1, Math.floor((clientY - rect.top) / EDIT_SLOT_HEIGHT)));
  };

  const stopAutoScroll = () => {
    if (autoScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  };

  const cancelSelection = (cancelGesture = false) => {
    selectionRef.current = null;
    setSelection(null);
    if (cancelGesture) {
      selectionCancelledRef.current = true;
    }
    stopAutoScroll();
  };

  const updateSelection = (currentIndex: number) => {
    const startIndex = selectionStartRef.current;
    if (startIndex === null || selectionCancelledRef.current) return;

    if (currentIndex < startIndex) {
      cancelSelection(true);
      return;
    }

    if (currentIndex === startIndex) {
      selectionRef.current = null;
      setSelection(null);
      return;
    }

    const nextSelection = { startIndex, endIndex: currentIndex };
    selectionRef.current = nextSelection;
    setSelection(nextSelection);
  };

  const getAutoScrollSpeed = (pointerY: number) => {
    if (pointerY < EDGE_THRESHOLD) {
      return -Math.min(
        MAX_SCROLL_SPEED,
        Math.round(((EDGE_THRESHOLD - pointerY) / EDGE_THRESHOLD) * MAX_SCROLL_SPEED),
      );
    }

    const distanceToBottom = window.innerHeight - pointerY;
    if (distanceToBottom < EDGE_THRESHOLD) {
      return Math.min(
        MAX_SCROLL_SPEED,
        Math.round(((EDGE_THRESHOLD - distanceToBottom) / EDGE_THRESHOLD) * MAX_SCROLL_SPEED),
      );
    }

    return 0;
  };

  const runAutoScroll = () => {
    if (activePointerRef.current === null || selectionCancelledRef.current) {
      stopAutoScroll();
      return;
    }

    const speed = getAutoScrollSpeed(pointerYRef.current);
    if (speed !== 0) {
      window.scrollBy(0, speed);
      updateSelection(slotFromPointer(pointerYRef.current));
    }

    autoScrollFrameRef.current = window.requestAnimationFrame(runAutoScroll);
  };

  const resetGesture = () => {
    activePointerRef.current = null;
    selectionStartRef.current = null;
    selectionCancelledRef.current = false;
    selectionRef.current = null;
    setSelection(null);
    stopAutoScroll();
  };

  const finishSelection = (finalSelection: Selection | null) => {
    if (!finalSelection || finalSelection.endIndex <= finalSelection.startIndex) {
      resetGesture();
      return;
    }
    const startMinute = finalSelection.startIndex * SLOT_MINUTES;
    const endMinute = finalSelection.endIndex * SLOT_MINUTES;
    resetGesture();

    if (blocksOverlap(startMinute, endMinute, blocks)) {
      onOverlap?.();
      return;
    }
    onCreate?.(startMinute, endMinute);
  };

  const getTouchCenterY = () => {
    const positions = [...touchPointersRef.current.values()];
    return positions.reduce((sum, position) => sum + position, 0) / positions.length;
  };

  const endPointer = (pointerId: number) => {
    touchPointersRef.current.delete(pointerId);

    if (isTwoFingerGestureRef.current) {
      twoFingerCenterYRef.current =
        touchPointersRef.current.size >= 2 ? getTouchCenterY() : null;
      if (touchPointersRef.current.size === 0) {
        isTwoFingerGestureRef.current = false;
      }
      resetGesture();
      return;
    }

    if (selectionCancelledRef.current) {
      resetGesture();
      return;
    }
    finishSelection(selectionRef.current);
  };

  if (mode === "main") {
    return (
      <div className="main-timeline">
        <div className="main-time-labels" aria-hidden="true">
          {Array.from({ length: 25 }, (_, hour) => hour * 60).map((minute) => (
            <span key={minute} style={{ top: `${(minute / SLOT_MINUTES) * MAIN_SLOT_HEIGHT}px` }}>
              {formatTime(minute)}
            </span>
          ))}
        </div>
        <div className="main-track">
          <div className="main-grid" />
          <div
            ref={currentLineRef}
            className="current-time-line"
            style={{ top: `${(currentMinute / SLOT_MINUTES) * MAIN_SLOT_HEIGHT}px` }}
            aria-label={`현재 시간 ${formatTime(currentMinute)}`}
          >
            <span>{formatTime(currentMinute)}</span>
          </div>
          {blocks.map((block) => (
            <TimeBlock
              key={block.id}
              block={block}
              mode="main"
              isCurrent={currentMinute >= block.startMinute && currentMinute < block.endMinute}
              onClick={() => onToggle?.(block.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="edit-timeline-shell">
      <div className="edit-time-labels" aria-hidden="true">
        {Array.from({ length: 25 }, (_, hour) => hour * 60).map((minute) => (
          <span key={minute} style={{ top: `${(minute / SLOT_MINUTES) * EDIT_SLOT_HEIGHT}px` }}>
            {formatTime(minute)}
          </span>
        ))}
      </div>
      <div
        ref={timelineRef}
        className="edit-track-stack"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const startedOnBlock =
            event.target instanceof Element && event.target.closest(".time-block-edit") !== null;

          if (event.pointerType === "touch") {
            touchPointersRef.current.set(event.pointerId, event.clientY);
            if (touchPointersRef.current.size >= 2) {
              isTwoFingerGestureRef.current = true;
              twoFingerCenterYRef.current = getTouchCenterY();
              for (const pointerId of touchPointersRef.current.keys()) {
                event.currentTarget.setPointerCapture(pointerId);
              }
              activePointerRef.current = null;
              cancelSelection(true);
              window.dispatchEvent(new Event(CANCEL_BLOCK_LONG_PRESS_EVENT));
              return;
            }
          }

          if (startedOnBlock) return;

          event.currentTarget.setPointerCapture(event.pointerId);
          const slot = slotFromPointer(event.clientY);
          activePointerRef.current = event.pointerId;
          selectionStartRef.current = slot;
          selectionCancelledRef.current = false;
          pointerYRef.current = event.clientY;
          selectionRef.current = null;
          setSelection(null);
          stopAutoScroll();
          autoScrollFrameRef.current = window.requestAnimationFrame(runAutoScroll);
        }}
        onPointerMove={(event) => {
          if (event.pointerType === "touch" && touchPointersRef.current.has(event.pointerId)) {
            touchPointersRef.current.set(event.pointerId, event.clientY);
          }

          if (isTwoFingerGestureRef.current && touchPointersRef.current.size >= 2) {
            const centerY = getTouchCenterY();
            const previousCenterY = twoFingerCenterYRef.current;
            if (previousCenterY !== null) {
              window.scrollBy(0, previousCenterY - centerY);
            }
            twoFingerCenterYRef.current = centerY;
            return;
          }

          if (
            activePointerRef.current !== event.pointerId ||
            !event.currentTarget.hasPointerCapture(event.pointerId)
          ) {
            return;
          }
          pointerYRef.current = event.clientY;
          updateSelection(slotFromPointer(event.clientY));
        }}
        onPointerUp={(event) => endPointer(event.pointerId)}
        onPointerCancel={(event) => endPointer(event.pointerId)}
      >
        <div className="edit-track">
          {slots.map((slot) => (
            <div
              className={`timeline-slot ${slot % 6 === 0 ? "hour-slot" : ""}`}
              key={slot}
              style={{ height: `${EDIT_SLOT_HEIGHT}px` }}
            />
          ))}
          {selection && (
            <div
              className="selection-preview"
              style={{
                top: `${selection.startIndex * EDIT_SLOT_HEIGHT}px`,
                height: `${(selection.endIndex - selection.startIndex) * EDIT_SLOT_HEIGHT}px`,
              }}
            >
              {formatTime(selection.startIndex * SLOT_MINUTES)} -{" "}
              {formatTime(selection.endIndex * SLOT_MINUTES)}
            </div>
          )}
        </div>
        <div className="edit-block-layer">
          {blocks.map((block) => (
            <TimeBlock key={block.id} block={block} mode="edit" onEdit={() => onEdit?.(block)} />
          ))}
        </div>
      </div>
    </div>
  );
}
