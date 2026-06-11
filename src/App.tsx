import { useEffect, useState } from "react";
import type { Screen } from "./types/schedule";
import { MainPage } from "./pages/MainPage";
import { EditPage } from "./pages/EditPage";
import { useScheduleStore } from "./store/scheduleStore";

export default function App() {
  const [screen, setScreen] = useState<Screen>("main");
  const loadBlocks = useScheduleStore((state) => state.loadBlocks);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  return screen === "main" ? (
    <MainPage onEdit={() => setScreen("edit")} />
  ) : (
    <EditPage onDone={() => setScreen("main")} onCancel={() => setScreen("main")} />
  );
}
