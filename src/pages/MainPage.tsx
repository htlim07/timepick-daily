import { useEffect, useState } from "react";
import { BottomButton } from "../components/BottomButton";
import { Timeline } from "../components/Timeline";
import { getTimepickDay, useScheduleStore } from "../store/scheduleStore";
import { getCurrentTimelineMinute } from "../utils/time";

type MainPageProps = {
  onEdit: () => void;
};

export function MainPage({ onEdit }: MainPageProps) {
  const { scheduleBlocks, beginEdit, toggleDone, yesterdaySummary, dismissSummary, alarmEnabled, setAlarmEnabled } = useScheduleStore();
  const [alarmMessage, setAlarmMessage] = useState("");
  const completed = scheduleBlocks.filter((block) => block.isDone).length;
  const progress = scheduleBlocks.length ? Math.round((completed / scheduleBlocks.length) * 100) : 0;
  const today = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  useEffect(() => {
    if (!alarmEnabled || !("Notification" in window) || Notification.permission !== "granted") return;
    const notifyDueBlocks = () => {
      const now = new Date();
      const minute = Math.floor(getCurrentTimelineMinute(now));
      scheduleBlocks.filter((block) => block.startMinute === minute).forEach((block) => {
        const sentKey = `daily-planner-alarm-sent:${getTimepickDay(now)}:${block.id}`;
        try {
          if (localStorage.getItem(sentKey)) return;
          new Notification("Timepick Daily", { body: `${block.title} 시작 시간이에요.`, tag: sentKey });
          localStorage.setItem(sentKey, "true");
        } catch { /* Notification or storage can be restricted. */ }
      });
    };
    notifyDueBlocks();
    const timer = window.setInterval(notifyDueBlocks, 15_000);
    return () => window.clearInterval(timer);
  }, [alarmEnabled, scheduleBlocks]);

  const toggleAlarm = async () => {
    setAlarmMessage("");
    if (alarmEnabled) { setAlarmEnabled(false); return; }
    if (!("Notification" in window)) { setAlarmMessage("이 브라우저는 알림을 지원하지 않아요."); return; }
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission === "granted") setAlarmEnabled(true);
    else setAlarmMessage("브라우저 설정에서 알림 권한을 허용해 주세요.");
  };

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

      <section className="alarm-panel" aria-label="일정 알람 설정">
        <div><strong>일정 시작 알람</strong><span>{alarmEnabled ? "각 타임 블록 시작에 알려드려요" : "브라우저가 열려 있을 때 알림을 받을 수 있어요"}</span></div>
        <button type="button" role="switch" aria-checked={alarmEnabled} className={`alarm-switch ${alarmEnabled ? "is-on" : ""}`} onClick={toggleAlarm}><span /></button>
      </section>
      {alarmMessage && <p className="alarm-message" role="status">{alarmMessage}</p>}

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

      {yesterdaySummary && (
        <div className="summary-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismissSummary(); }}>
          <section className="daily-summary" role="dialog" aria-modal="true" aria-labelledby="summary-title">
            <span className="eyebrow">YESTERDAY'S RECORD</span>
            <h2 id="summary-title">어제도 수고했어요</h2>
            <div className="summary-score"><strong>{yesterdaySummary.total ? Math.round((yesterdaySummary.completed / yesterdaySummary.total) * 100) : 0}%</strong><span>{yesterdaySummary.completed} / {yesterdaySummary.total} 완료</span></div>
            {yesterdaySummary.completedTitles.length > 0 ? <ul>{yesterdaySummary.completedTitles.map((title, index) => <li key={`${title}-${index}`}>✓ {title}</li>)}</ul> : <p>완료 체크는 없었지만, 새로운 하루는 다시 시작할 수 있어요.</p>}
            <button type="button" className="summary-confirm" onClick={dismissSummary}>오늘 시작하기</button>
          </section>
        </div>
      )}
    </main>
  );
}
