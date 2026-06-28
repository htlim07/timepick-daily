import { useEffect, useState } from "react";
import type { Screen } from "./types/schedule";
import { MainPage } from "./pages/MainPage";
import { EditPage } from "./pages/EditPage";
import { useScheduleStore } from "./store/scheduleStore";

export default function App() {
  const [screen, setScreen] = useState<Screen>("main");
  const loadBlocks = useScheduleStore((state) => state.loadBlocks);
  const checkDailyReset = useScheduleStore((state) => state.checkDailyReset);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  useEffect(() => {
    const timer = window.setInterval(checkDailyReset, 30_000);
    const onVisible = () => { if (document.visibilityState === "visible") checkDailyReset(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [checkDailyReset]);

  return screen === "main" ? (
    <MainPage onEdit={() => setScreen("edit")} />
  ) : (
    <EditPage onDone={() => setScreen("main")} onCancel={() => setScreen("main")} />
  );
}
