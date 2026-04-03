export const DAILY_TASKS = [
  { key: "review_hands", label: "Review Hand Histories" },
  { key: "study_video", label: "Watch Training Video" },
  { key: "play_session", label: "Play Session" },
  { key: "mental_game", label: "Mental Game / Meditation" },
  { key: "take_notes", label: "Take Notes" },
] as const

export type TaskKey = (typeof DAILY_TASKS)[number]["key"]
