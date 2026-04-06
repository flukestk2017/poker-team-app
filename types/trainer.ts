export interface Profile {
  id: string;
  name: string;
  role: "admin" | "member";
  streak: number;
  last_practice_date: string | null;
  total_sessions: number;
  total_minutes: number;
  created_at: string;
}

export interface VocabProgress {
  id: string;
  user_id: string;
  word: string;
  status: "learning" | "known";
  times_seen: number;
  times_correct: number;
  last_seen: string;
}

export interface SessionLog {
  id: string;
  user_id: string;
  date: string;
  modules_completed: string[];
  duration_minutes: number;
  notes: string;
}

export interface QAHistory {
  id: string;
  user_id: string;
  hand_scenario: string;
  user_answer: string;
  ai_feedback: string;
  created_at: string;
}

export interface Flashcard {
  word: string;
  pos: string;
  thai_def: string;
  english_example: string;
}

export interface CoachingPhrase {
  phrase: string;
  thai_meaning: string;
  situation: string;
  keywords: string[];
}

export interface ChatMessage {
  role: "coach" | "user";
  content: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface VideoAnalysisResult {
  terms: string[];
  quiz: QuizQuestion[];
}

export interface ModuleStatus {
  vocab: boolean;
  coach: boolean;
  listen: boolean;
  video: boolean;
}
