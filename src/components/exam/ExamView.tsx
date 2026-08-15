"use client";
import React, { useState, useRef, useEffect } from 'react';
import { MCQQuestion } from '../../types/mcq';
import { ExamSetup, ExamConfig } from './ExamSetup';
import { ExamInstructions } from './ExamInstructions';
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
  /** Notifies the app shell that a dedicated question session started/ended. */
  onExamModeChange?: (inSession: boolean) => void;
}

export const ExamView: React.FC<ExamViewProps> = ({ 
  availableChapters, 
  totalAvailable, 
  prefilledChapter, 
  onReturnHome,
  onFetchQuestions,
  onExamModeChange,
}) => {
  const [stage, setStage] = useState<'setup' | 'instructions' | 'live' | 'results'>('setup');
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [examQuestions, setExamQuestions] = useState<MCQQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeTaken, setTimeTaken] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const startingRef = useRef(false);
  const finishingRef = useRef(false);

  // Question-solving stages (instructions / live / results) run in the dedicated
  // shell without the app's sidebar and header; the setup screen keeps them.
  useEffect(() => {
    onExamModeChange?.(stage !== 'setup');
  }, [stage, onExamModeChange]);

  const handleStartExam = async (newConfig: ExamConfig) => {
    // Guard against double-click / repeated Start submissions.
    if (startingRef.current) return;
    startingRef.current = true;
    setIsLoading(true);
    try {
      const selected = await onFetchQuestions(newConfig.chapter, newConfig.difficulty, newConfig.questionCount);

      if (selected.length === 0) {
        alert("No questions match your criteria! Try changing the chapter or difficulty.");
        setIsLoading(false);
        return;
      }

      setConfig(newConfig);
      setExamQuestions(selected);

      if (newConfig.mode === 'EXAM') {
        // Show the instructions screen first; the attempt is created when the
        // candidate starts the simulation (avoids abandoned attempts).
        setStage('instructions');
      } else {
        // Practice mode: create the attempt immediately and begin.
        const id = await startExamAttempt(newConfig.mode, newConfig.chapter, selected.length, newConfig.negativeMarking);
        setAttemptId(id);
        setStage('live');
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start session. Please try again.");
    } finally {
      setIsLoading(false);
      startingRef.current = false;
    }
  };

  const handleStartSimulation = async () => {
    if (!config) return;
    // Guard against double-click on "Start Simulation".
    if (startingRef.current) return;
    startingRef.current = true;
    setIsLoading(true);
    try {
      const id = await startExamAttempt(config.mode, config.chapter, examQuestions.length, config.negativeMarking);
      setAttemptId(id);
      setStage('live');
    } catch (err) {
      console.error(err);
      alert("Failed to start simulation. Please try again.");
    } finally {
      setIsLoading(false);
      startingRef.current = false;
    }
  };

  const handleFinishExam = async (finalAnswers: Record<string, string>, timeTakenSeconds: number) => {
    // Guard against double-submit (double clicks, repeated timer auto-submit).
    if (finishingRef.current) return;
    finishingRef.current = true;
    setAnswers(finalAnswers);
    setTimeTaken(timeTakenSeconds);
    
    if (config?.mode === 'EXAM') {
      try {
        await finishExamAttemptBatch(attemptId, timeTakenSeconds, finalAnswers);
      } catch (err) {
        // Surface the failure instead of silently advancing to results with
        // an attempt that was never persisted (BUG-07).
        console.error("Failed to save exam attempt", err);
        finishingRef.current = false; // allow the user to retry
        alert("Failed to submit your exam. Please try again.");
        return;
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
    finishingRef.current = false; // allow the next attempt to finish normally
  };

  return (
    <div className="min-h-full animate-in fade-in duration-300 relative">
      {/* The dedicated shell hides the app chrome, so the document needs a
          level-one heading for the question-solving stages. */}
      {(stage === 'instructions' || stage === 'live' || stage === 'results') && (
        <h1 className="sr-only">
          {stage === 'instructions'
            ? 'Exam Instructions'
            : stage === 'results'
            ? config?.mode === 'PRACTICE'
              ? 'Practice Results'
              : 'Exam Results'
            : config?.mode === 'PRACTICE'
            ? 'Quick Practice'
            : 'Simulated Exam'}
        </h1>
      )}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#070914]/60 backdrop-blur-sm rounded-3xl">
          <div className="text-xl font-bold text-[#c4a8ff] animate-pulse">Loading Questions...</div>
        </div>
      )}

      {stage === 'setup' && (
        <ExamSetup 
          availableChapters={availableChapters} 
          totalAvailable={totalAvailable} 
          onStartExam={handleStartExam} 
          prefilledChapter={prefilledChapter}
          onBack={onReturnHome}
        />
      )}
      
      {stage === 'instructions' && config && (
        <ExamInstructions
          config={config}
          questionCount={examQuestions.length}
          onStart={handleStartSimulation}
          onCancel={handleRetake}
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
