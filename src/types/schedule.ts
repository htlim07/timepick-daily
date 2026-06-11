export type BlockColor = "blue" | "green" | "purple" | "orange" | "pink" | "teal";

export type ScheduleBlock = {
  id: string;
  title: string;
  startMinute: number;
  endMinute: number;
  isDone: boolean;
  color: BlockColor;
};

export type Screen = "main" | "edit";
