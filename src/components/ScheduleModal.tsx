import { useEffect, useState } from "react";
import type { ScheduleBlock } from "../types/schedule";
import { formatRange } from "../utils/time";

type ScheduleModalProps = {
  block: ScheduleBlock;
  mode: "create" | "edit";
  onConfirm: (title: string) => void;
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

  useEffect(() => {
    setTitle(block.title);
  }, [block]);

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
            if (title.trim()) onConfirm(title.trim());
          }}
        >
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 아침 운동"
            maxLength={40}
          />
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
