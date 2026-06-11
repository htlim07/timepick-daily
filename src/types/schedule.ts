export type BlockColor =
  | "blue"
  | "green"
  | "purple"
  | "yellow"
  | "pink"
  | "teal"
  | "orange"
  | "gray";

export type ScheduleBlock = {
  id: string;
  title: string;
  startMinute: number;
  endMinute: number;
  isDone: boolean;
  color: BlockColor;
};

export type Screen = "main" | "edit";
