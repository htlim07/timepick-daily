import { useEffect, useState } from "react";
import type { BlockColor, ScheduleBlock } from "../types/schedule";
import { BLOCK_COLOR_OPTIONS } from "../utils/colors";
import { blocksOverlap, DAY_MINUTES, formatTime, SLOT_MINUTES } from "../utils/time";

type ScheduleModalProps = {
  block: ScheduleBlock;
  blocks: ScheduleBlock[];
  mode: "create" | "edit";
  onConfirm: (
    title: string,
    selectedColor: BlockColor | null,
    startMinute: number,
    endMinute: number,
  ) => void;
  onDelete: () => void;
  onClose: () => void;
};

const startOptions = Array.from(
  { length: DAY_MINUTES / SLOT_MINUTES },
  (_, index) => index * SLOT_MINUTES,
);
const endOptions = Array.from(
  { length: DAY_MINUTES / SLOT_MINUTES },
  (_, index) => (index + 1) * SLOT_MINUTES,
);

function formatTimeOption(minute: number) {
  return minute === DAY_MINUTES ? `다음날 ${formatTime(minute)}` : formatTime(minute);
}

export function ScheduleModal({
  block,
  blocks,
  mode,
  onConfirm,
  onDelete,
  onClose,
}: ScheduleModalProps) {
  const [title, setTitle] = useState(block.title);
  const [selectedColor, setSelectedColor] = useState<BlockColor | null>(
    mode === "create" ? null : block.color,
  );
  const [startMinute, setStartMinute] = useState(block.startMinute);
  const [endMinute, setEndMinute] = useState(block.endMinute);
  const hasInvalidRange = endMinute <= startMinute;
  const hasOverlap =
    !hasInvalidRange && blocksOverlap(startMinute, endMinute, blocks, block.id);
  const canSubmit = Boolean(title.trim()) && !hasInvalidRange && !hasOverlap;

  useEffect(() => {
    setTitle(block.title);
    setSelectedColor(mode === "create" ? null : block.color);
    setStartMinute(block.startMinute);
    setEndMinute(block.endMinute);
  }, [block, mode]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="modal-backdrop" onPointerDown={onClose}>
      <div
        className="schedule-modal"
        onPointerDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">{mode === "create" ? "NEW BLOCK" : "EDIT BLOCK"}</span>
            <h2 id="modal-title">{mode === "create" ? "무엇을 할까요?" : "일정 수정"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="닫기" type="button">
            ×
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) onConfirm(title.trim(), selectedColor, startMinute, endMinute);
          }}
        >
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="할 일 입력"
            maxLength={40}
          />
          <div className="time-picker">
            <label>
              <span>시작 시간</span>
              <select
                value={startMinute}
                onChange={(event) => setStartMinute(Number(event.target.value))}
              >
                {startOptions.map((minute) => (
                  <option key={minute} value={minute}>
                    {formatTimeOption(minute)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>종료 시간</span>
              <select
                value={endMinute}
                onChange={(event) => setEndMinute(Number(event.target.value))}
              >
                {endOptions.map((minute) => (
                  <option key={minute} value={minute}>
                    {formatTimeOption(minute)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {(hasInvalidRange || hasOverlap) && (
            <p className="modal-error" role="alert">
              {hasInvalidRange
                ? "종료 시간은 시작 시간보다 늦어야 합니다."
                : "선택한 시간이 기존 일정과 겹칩니다."}
            </p>
          )}
          <fieldset className="color-picker">
            <legend>색상</legend>
            <div className="color-options">
              <button
                className={`auto-color-button ${selectedColor === null ? "is-selected" : ""}`}
                onClick={() => setSelectedColor(null)}
                type="button"
                aria-pressed={selectedColor === null}
              >
                자동
              </button>
              {BLOCK_COLOR_OPTIONS.map(({ color, label }) => (
                <button
                  key={color}
                  className={`color-option ${selectedColor === color ? "is-selected" : ""}`}
                  style={{ backgroundColor: `var(--block-${color})` }}
                  onClick={() => setSelectedColor(color)}
                  type="button"
                  aria-label={label}
                  aria-pressed={selectedColor === color}
                  title={label}
                >
                  {selectedColor === color ? "✓" : ""}
                </button>
              ))}
            </div>
            <span className="color-picker-help">
              {selectedColor === null
                ? "주변 일정과 겹치지 않는 색상을 자동으로 선택합니다."
                : "선택한 색상으로 표시합니다."}
            </span>
          </fieldset>
          <div className="modal-actions">
            {mode === "edit" && (
              <button className="delete-button" onClick={onDelete} type="button">
                삭제
              </button>
            )}
            <button className="cancel-button" onClick={onClose} type="button">
              취소
            </button>
            <button className="confirm-button" disabled={!canSubmit} type="submit">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
