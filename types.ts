export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface LectureAnalysis {
  title: string;
  summary: string;
  keyPoints: string[];
  flashcards: Flashcard[];
  quizzes: QuizQuestion[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface SavedMaterial {
  id: string;
  title: string;
  type: 'file' | 'url';
  date: Date;
  analysis: LectureAnalysis;
  originalSource: string; // filename or url
}

export interface Subject {
  id: string;
  name: string;
  materials: SavedMaterial[];
  color: string;
}