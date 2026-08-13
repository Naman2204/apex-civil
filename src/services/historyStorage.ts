export interface ExamHistoryRecord {
  id: string;
  date: string;
  chapter: string;
  difficulty: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  timeTakenSeconds: number;
}

const STORAGE_KEY = 'exam_history_v1';

export const HistoryStorage = {
  saveRecord: (record: Omit<ExamHistoryRecord, 'id' | 'date'>) => {
    const newRecord: ExamHistoryRecord = {
      ...record,
      id: `record-${Date.now()}`,
      date: new Date().toISOString(),
    };
    
    const existing = HistoryStorage.getHistory();
    existing.unshift(newRecord); // Add to beginning
    
    // Keep only the last 50 records to prevent localstorage bloat
    const trimmed = existing.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  },
  
  getHistory: (): ExamHistoryRecord[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse history', e);
      return [];
    }
  },
  
  clearHistory: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
