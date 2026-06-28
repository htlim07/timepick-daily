import { useState } from "react";
import { BottomButton } from "../components/BottomButton";
import { ScheduleModal } from "../components/ScheduleModal";
import { Timeline } from "../components/Timeline";
import { useScheduleStore } from "../store/scheduleStore";
import type { ScheduleBlock } from "../types/schedule";
import { getNextBlockColor } from "../utils/colors";
import { blocksOverlap } from "../utils/time";

type EditPageProps = {
  onDone: () => void;
  onCancel: () => void;
};

type ModalState = {
  block: ScheduleBlock;
  mode: "create" | "edit";
} | null;

export function EditPage({ onDone, onCancel }: EditPageProps) {
  const { draftBlocks, addDraft, updateDraft, removeDraft, clearDraft, commitDraft } = useScheduleStore();
  const [modal, setModal] = useState<ModalState>(null);
  const [notice, setNotice] = useState("");

  const showOverlapNotice = () => {
    setNotice("이미 일정이 있는 시간입니다.");
    window.setTimeout(() => setNotice(""), 2200);
  };

  const closeModal = () => {
    if (modal?.mode === "create") removeDraft(modal.block.id);
    setModal(null);
  };

  return (
    <main className="page-shell edit-page">
      <header className="edit-header">
        <button className="text-button" onClick={onCancel} type="button">
          취소
        </button>
        <div>
          <span className="eyebrow">BUILD YOUR DAY</span>
          <h1>시간을 드래그하세요</h1>
        </div>
        <div className="edit-actions">
          <button
            className="clear-all-button"
            type="button"
            disabled={draftBlocks.length === 0}
            onClick={() => {
              if (window.confirm("모든 일정을 지울까요? 완료하기 전에는 취소할 수 있어요.")) {
                clearDraft();
              }
            }}
          >
            모두 지우기
          </button>
          <span className="block-count">{draftBlocks.length}</span>
        </div>
      </header>
      <p className="edit-guide">10분 단위로 원하는 구간을 쓸어 선택할 수 있어요.</p>

      <section className="edit-timeline-card">
        <Timeline
          blocks={draftBlocks}
          mode="edit"
          onCreate={(startMinute, endMinute) => {
            const block: ScheduleBlock = {
              id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              title: "",
              startMinute,
              endMinute,
              isDone: false,
              color: getNextBlockColor(draftBlocks, startMinute, endMinute),
            };
            addDraft(block);
            setModal({ block, mode: "create" });
          }}
          onEdit={(block) => setModal({ block, mode: "edit" })}
          onOverlap={showOverlapNotice}
        />
      </section>

      {notice && <div className="toast">{notice}</div>}
      {modal && (
        <ScheduleModal
          block={modal.block}
          blocks={draftBlocks}
          mode={modal.mode}
          onClose={closeModal}
          onDelete={() => {
            removeDraft(modal.block.id);
            setModal(null);
          }}
          onConfirm={(title, selectedColor, startMinute, endMinute) => {
            if (
              endMinute <= startMinute ||
              blocksOverlap(startMinute, endMinute, draftBlocks, modal.block.id)
            ) {
              showOverlapNotice();
              return;
            }
            const color =
              selectedColor ??
              (modal.mode === "create"
                ? modal.block.color
                : getNextBlockColor(
                    draftBlocks.filter((block) => block.id !== modal.block.id),
                    startMinute,
                    endMinute,
                  ));
            updateDraft(modal.block.id, { title, color, startMinute, endMinute });
            setModal(null);
          }}
        />
      )}

      {!modal && (
        <div className="bottom-bar">
          <BottomButton
            onClick={() => {
              commitDraft();
              onDone();
            }}
          >
            <span>이 일정으로 시작하기</span>
            <span>✓</span>
          </BottomButton>
        </div>
      )}
    </main>
  );
}
