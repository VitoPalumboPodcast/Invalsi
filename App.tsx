import React, { useState, useCallback, useEffect } from 'react';
import { AppState, TestConfig, Question, TestResult, TestMode } from './types';
import { generateInvalsiTest, generateQuestionsFromText } from './services/geminiService';
import TestConfigScreen from './components/TestConfigScreen';
import TestRunner from './components/TestRunner';
import ResultScreen from './components/ResultScreen';
import HistoryScreen from './components/HistoryScreen';
import CustomTestModal from './components/CustomTestModal'; // Import new component
import { Loader2, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.CONFIG);
  const [config, setConfig] = useState<TestConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false); // State for the new modal

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('invalsi_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (newResult: TestResult) => {
    const updatedHistory = [...history, newResult];
    setHistory(updatedHistory);
    localStorage.setItem('invalsi_history', JSON.stringify(updatedHistory));
  };

  const startTest = useCallback(async (newConfig: TestConfig) => {
    setConfig(newConfig);
    setAppState(AppState.LOADING);
    setError(null);

    try {
      const generatedQuestions = await generateInvalsiTest(
        newConfig.subject,
        newConfig.grade,
        newConfig.questionCount
      );
      setQuestions(generatedQuestions);
      setAppState(AppState.TESTING);
    } catch (err) {
      setError("Impossibile generare la prova standard. Verifica la tua connessione o riprova più tardi.");
      setAppState(AppState.CONFIG);
    }
  }, []);

  // New function to handle custom test generation
  const startCustomTest = useCallback(async (baseConfig: Omit<TestConfig, 'mode'>, customText: string) => {
    // FIX: Used TestMode enum member instead of a string literal for type safety.
    const newConfig: TestConfig = { ...baseConfig, mode: TestMode.ALLENAMENTO }; // Custom tests are always in training mode
    setConfig(newConfig);
    setIsCustomModalOpen(false);
    setAppState(AppState.LOADING);
    setError(null);

    try {
      const generatedQuestions = await generateQuestionsFromText(
        customText,
        newConfig.subject,
        newConfig.grade,
        newConfig.questionCount
      );
      setQuestions(generatedQuestions);
      setAppState(AppState.TESTING);
    } catch (err) {
      setError("Impossibile generare la prova dal testo fornito. L'AI potrebbe non essere riuscita ad analizzarlo.");
      setAppState(AppState.CONFIG);
    }
  }, []);

  const handleTestComplete = (testResult: TestResult) => {
    setResult(testResult);
    saveToHistory(testResult);
    setAppState(AppState.RESULTS);
  };

  const resetApp = () => {
    setAppState(AppState.CONFIG);
    setConfig(null);
    setQuestions([]);
    setResult(null);
    setError(null);
  };

  const restartSameConfig = () => {
    if (config) {
      startTest(config);
    } else {
      resetApp();
    }
  };

  const reviewTest = (pastResult: TestResult) => {
    setResult(pastResult);
    setAppState(AppState.RESULTS);
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans selection:bg-blue-100 bg-slate-50">
      
      {appState === AppState.CONFIG && (
        <>
          <TestConfigScreen 
            onStart={startTest} 
            onViewHistory={() => setAppState(AppState.HISTORY)}
            onOpenCustomModal={() => setIsCustomModalOpen(true)}
          />
          <CustomTestModal
            isOpen={isCustomModalOpen}
            onClose={() => setIsCustomModalOpen(false)}
            onGenerate={startCustomTest}
          />
          {error && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2 shadow-lg animate-bounce z-50">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
        </>
      )}

      {appState === AppState.HISTORY && (
        <HistoryScreen 
          history={history}
          onBack={() => setAppState(AppState.CONFIG)}
          onReview={reviewTest}
        />
      )}

      {appState === AppState.LOADING && (
        <div className="flex flex-col items-center justify-center h-screen bg-white">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <h2 className="mt-8 text-2xl font-bold text-slate-800">Generazione Prova in corso...</h2>
          <p className="text-slate-500 mt-2 text-lg text-center max-w-md">
            L'Intelligenza Artificiale sta creando domande inedite basate sullo storico Invalsi o sul testo fornito.
          </p>
        </div>
      )}

      {appState === AppState.TESTING && config && (
        <TestRunner 
          questions={questions}
          config={config}
          onComplete={handleTestComplete}
          onExit={resetApp}
        />
      )}

      {appState === AppState.RESULTS && result && (
        <ResultScreen 
          result={result} 
          onRestart={restartSameConfig}
          onHome={resetApp}
        />
      )}
    </div>
  );
};

export default App;