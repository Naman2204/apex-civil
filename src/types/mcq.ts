export interface MCQOption {
  id: string; // 'A' | 'B' | 'C' | 'D' or UUID
  label: string; // 'A', 'B', 'C', 'D'
  text: string;
}

export interface MCQQuestion {
  id: string;
  pdfId?: string;
  pdfName?: string;
  question: string;
  options: MCQOption[];
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D'
  explanation?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
  chapter?: string;
  pageNumber?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PDFDocumentRecord {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  questionCount: number;
  status: 'processed' | 'processing' | 'failed';
  lastScannedPage?: number;
}

export interface QuizResult {
  id: string;
  date: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  userAnswers: Record<string, string>; // questionId -> selectedOptionLabel
}

export interface DatabaseStats {
  totalQuestions: number;
  totalPDFs: number;
  questionsByDifficulty: { Easy: number; Medium: number; Hard: number };
  pdfSources: { id: string; name: string; count: number }[];
}
