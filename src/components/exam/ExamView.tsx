"use client";
import React, { useState } from 'react';
import { MCQQuestion } from '../../types/mcq';
import { ExamSetup, ExamConfig } from './ExamSetup';
import { LiveExam } from './LiveExam';
import { PracticeView } from './PracticeView';
import { ExamResults } from './ExamResults';
import { startExamAttempt, finishExamAttemptBatch } from '../../app/actions';

interface ExamViewProps {
  availableChapters: string[];
  totalAvailable: number;
  prefilledChapter?: string;
  onReturnHome: () => void;
  onFetchQuestions: (chapter: string, difficulty: string, limit: number) => Promise<MCQQuestion[]>;
  onSaveHistory?: (record: any) => Promise<void>; // Kept for backwards compatibility if needed, but not used now
}

export const ExamView: React.FC<ExamViewProps> = ({ 
  availableChapters, 
  totalAvailable, 
  prefilledChapter, 
  onReturnHome,
  onFetchQuestions,
}) => {
  const [stage, setStage] = useState<'setup' | 'live' | 'results'>('setup');
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [examQuestions, setExamQuestions] = useState<MCQQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeTaken, setTimeTaken] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartExam = async (newConfig: ExamConfig) => {
    setIsLoading(true);
    try {
      const selected = await onFetchQuestions(newConfig.chapter, newConfig.difficulty, newConfig.questionCount);

      if (selected.length === 0) {
        alert("No questions match your criteria! Try changing the chapter or difficulty.");
        setIsLoading(false);
        return;
      }

      // Create an ExamAttempt in DB
      const id = await startExamAttempt(newConfig.mode, newConfig.chapter, selected.length, newConfig.negativeMarking);
      
      setConfig(newConfig);
      setExamQuestions(selected);
      setAttemptId(id);
      setStage('live');
    } catch (err) {
      console.error(err);
      alert("Failed to start session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishExam = async (finalAnswers: Record<string, string>, timeTakenSeconds: number) => {
    setAnswers(finalAnswers);
    setTimeTaken(timeTakenSeconds);
    
    if (config?.mode === 'EXAM') {
      try {
        await finishExamAttemptBatch(attemptId, timeTakenSeconds, finalAnswers, examQuestions);
      } catch (err) {
        console.error("Failed to save exam attempt", err);
      }
    }
    
    setStage('results');
  };

  const handleRetake = () => {
    setStage('setup');
    setConfig(null);
    setExamQuestions([]);
    setAnswers({});
    setTimeTaken(0);
    setAttemptId('');
  };

  return (
    <div className="min-h-full animate-in fade-in duration-300 relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl">
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">Loading Questions...</div>
        </div>
      )}

      {stage === 'setup' && (
        <ExamSetup 
          availableChapters={availableChapters} 
          totalAvailable={totalAvailable} 
          onStartExam={handleStartExam} 
          prefilledChapter={prefilledChapter}
        />
      )}
      
      {stage === 'live' && config && (
        config.mode === 'PRACTICE' ? (
          <PracticeView 
            questions={examQuestions} 
            config={config}
            attemptId={attemptId}
            onFinish={handleFinishExam} 
            onCancel={handleRetake}
          />
        ) : (
          <LiveExam 
            questions={examQuestions} 
            config={config} 
            onFinish={handleFinishExam} 
            onCancel={handleRetake}
          />
        )
      )}
      
      {stage === 'results' && config && (
        <ExamResults 
          questions={examQuestions} 
          answers={answers} 
          timeTakenSeconds={timeTaken} 
          config={config}
          onRetake={handleRetake} 
          onReturnHome={onReturnHome}
        />
      )}
    </div>
  );
};
