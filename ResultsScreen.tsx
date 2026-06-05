export interface Test {
  code: string;
  keys: string[]; // Options chosen by admin: 'A', 'B', 'C', 'D' corresponding to indices 0..34
  createdAt: string;
  createdBy: string; // Admin Telegram User ID
}

export interface Submission {
  id: string;
  name: string;
  code: string;
  answers: Record<number, string>; // { 1: 'A', 2: 'B', ... 35: 'C' }
  score: number;
  totalQuestions: number;
  submittedAt: string;
}

export interface TelegramBotState {
  chatId: number;
  currentStep: number; // 1 to 35
  keys: string[]; // Answers accumulated
  lastMessageId?: number;
}
