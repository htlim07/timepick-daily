import { useEffect, useState } from "react";
import type { BlockColor, ScheduleBlock } from "../types/schedule";
import { BLOCK_COLOR_OPTIONS } from "../utils/colors";
import { formatRange } from "../utils/time";

type ScheduleModalProps = {
  block: ScheduleBlock;
  mode: "create" | "edit";
  onConfirm: (title: string, selectedColor: BlockColor | null) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function ScheduleModal({
  block,
  mode,
  onConfirm,
  onDelete,
  onClose,
}: ScheduleModalProps) {
  const [title, setTitle] = useState(block.title);
  const [selectedColor, setSelectedColor] = useState<BlockColor | null>(
    mode === "create" ? null : block.color,
  );

  useEffect(() => {
    setTitle(block.title);
    setSelectedColor(mode === "create" ? null : block.color);
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
        <p className="modal-time">{formatRange(block.startMinute, block.endMinute)}</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim()) onConfirm(title.trim(), selectedColor);
          }}
        >
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 아침 운동"
            maxLength={40}
          />
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
              {selectedColor === null ? "주변 일정과 겹치지 않는 색상을 자동으로 선택합니다." : "선택한 색상으로 표시합니다."}
            </span>
          </fieldset>
          <div className="modal-actions">
            {mode === "edit" && (
              <button className="delete-button" onClick={onDelete} type="button">
                삭제
              </button>
            )}
            <button className="confirm-button" disabled={!title.trim()} type="submit">
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
