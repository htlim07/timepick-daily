import { BottomButton } from "../components/BottomButton";
import { Timeline } from "../components/Timeline";
import { useScheduleStore } from "../store/scheduleStore";

type MainPageProps = {
  onEdit: () => void;
};

export function MainPage({ onEdit }: MainPageProps) {
  const { scheduleBlocks, beginEdit, toggleDone } = useScheduleStore();
  const completed = scheduleBlocks.filter((block) => block.isDone).length;
  const progress = scheduleBlocks.length ? Math.round((completed / scheduleBlocks.length) * 100) : 0;
  const today = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">TIMEPICK DAILY</span>
          <h1>오늘의 흐름</h1>
          <p>{today}</p>
        </div>
        <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
          <div>
            <strong>{progress}%</strong>
            <span>{completed}/{scheduleBlocks.length}</span>
          </div>
        </div>
      </header>

      {scheduleBlocks.length ? (
        <section className="timeline-card">
          <div className="section-heading">
            <span>06:00</span>
            <span>클릭해서 완료 체크</span>
            <span>+1 06:00</span>
          </div>
          <Timeline blocks={scheduleBlocks} mode="main" onToggle={toggleDone} />
        </section>
      ) : (
        <section className="empty-state">
          <div className="empty-clock">
            <span />
            <i />
          </div>
          <span className="eyebrow">A QUIET DAY</span>
          <h2>아직 오늘의 계획이 없어요</h2>
          <p>하루의 빈칸을 원하는 리듬으로 채워보세요.</p>
        </section>
      )}

      <div className="bottom-bar">
        <BottomButton
          onClick={() => {
            beginEdit();
            onEdit();
          }}
        >
          <span>오늘 일정 편집</span>
          <span>＋</span>
        </BottomButton>
      </div>
    </main>
  );
}
