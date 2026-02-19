import React, { useState, useEffect } from 'react';
import { Question, TestConfig, TestResult, TestMode, QuestionType } from '../types';
import { Timer, ArrowLeft, ArrowRight, Check, X, Grid, Printer, Volume2, StopCircle } from 'lucide-react';

interface Props {
  questions: Question[];
  config: TestConfig;
  onComplete: (result: TestResult) => void;
  onExit: () => void;
}

const TestRunner: React.FC<Props> = ({ questions, config, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>(new Array(questions.length).fill(-1));
  const [isAnswered, setIsAnswered] = useState<boolean[]>(new Array(questions.length).fill(false));
  const [startTime] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState(
    config.mode === TestMode.SIMULAZIONE ? 90 * 60 : 999999 
  );
  const [showPalette, setShowPalette] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Stop audio if user navigates away or component unmounts
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (config.mode !== TestMode.SIMULAZIONE) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [config.mode]);

  const handleSelectOption = (optionIndex: number) => {
    if (config.mode === TestMode.ALLENAMENTO && isAnswered[currentIndex]) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleMatrixSelect = (rowIndex: number, colIndex: number) => {
     if (config.mode === TestMode.ALLENAMENTO && isAnswered[currentIndex]) return;
     const newAnswers = [...answers];
     const currentMatrix = newAnswers[currentIndex] === -1 
        ? new Array(questions[currentIndex].matrixRows?.length || 0).fill(-1)
        : [...newAnswers[currentIndex]];
     currentMatrix[rowIndex] = colIndex;
     newAnswers[currentIndex] = currentMatrix;
     setAnswers(newAnswers);
  };

  const confirmAnswerTraining = () => {
    if (answers[currentIndex] === -1) return;
    const newIsAnswered = [...isAnswered];
    newIsAnswered[currentIndex] = true;
    setIsAnswered(newIsAnswered);
  };

  const checkAnswerCorrectness = (idx: number) => {
     const q = questions[idx];
     const ans = answers[idx];
     if (ans === -1) return false;
     if (q.type === QuestionType.MATRIX) {
        if (!Array.isArray(ans) || !q.matrixCorrectAnswer) return false;
        return ans.length === q.matrixCorrectAnswer.length && 
               ans.every((val: number, i: number) => val === q.matrixCorrectAnswer![i]);
     } else {
        return ans === q.correctAnswerIndex;
     }
  };

  const finishTest = () => {
    window.speechSynthesis.cancel();
    const endTime = Date.now();
    const correctCount = answers.reduce((acc, ans, idx) => {
      return checkAnswerCorrectness(idx) ? acc + 1 : acc;
    }, 0);

    const result: TestResult = {
      id: Date.now().toString(),
      date: Date.now(),
      config,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      scorePercentage: Math.round((correctCount / questions.length) * 100),
      timeElapsed: Math.floor((endTime - startTime) / 1000),
      answers: answers,
      questions: questions
    };
    onComplete(result);
  };

  const currentQ = questions[currentIndex];
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = isAnswered.filter(Boolean).length;
  const currentCorrect = isAnswered.reduce((acc, bool, idx) => {
     if (!bool) return acc;
     return checkAnswerCorrectness(idx) ? acc + 1 : acc;
  }, 0);

  const handlePrint = () => window.print();

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (currentQ.audioScript) {
        const utterance = new SpeechSynthesisUtterance(currentQ.audioScript);
        utterance.lang = 'en-GB'; 
        utterance.rate = 0.9;
        
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(v => v.lang.includes('en-GB')) || voices.find(v => v.lang.includes('en-US'));
        if (enVoice) utterance.voice = enVoice;

        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 font-sans print:h-auto print:bg-white print:block">
      
      {/* --- INTERACTIVE MODE (Hidden on print) --- */}
      <div className="flex-col flex h-full print:hidden">
        {/* Header */}
        <header className="bg-blue-900 text-white h-14 flex items-center justify-between px-4 shadow-md z-20 shrink-0">
            <div className="flex items-center gap-4">
            <span className="font-bold text-lg tracking-wider">INVALSI<span className="font-light text-blue-200">CBT</span></span>
            <div className="hidden md:block h-6 w-px bg-blue-700 mx-2"></div>
            <span className="text-sm font-medium truncate hidden md:block">{config.subject} - {config.grade}</span>
            </div>
            
            <div className="flex items-center gap-4">
            <button type="button" onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-sm transition-colors">
                <Printer className="w-4 h-4" /> <span className="hidden md:inline">Stampa</span>
            </button>

            {config.mode === TestMode.ALLENAMENTO ? (
                <div className="flex items-center gap-4 text-sm font-medium bg-blue-800 px-4 py-1.5 rounded-lg shadow-inner">
                    <span className="text-blue-200 flex flex-col md:flex-row items-center gap-1 md:gap-2 leading-tight">
                    <span className="text-[10px] md:text-xs uppercase tracking-wider opacity-70">Risposte</span>
                    <span className="font-bold">{answeredCount}/{questions.length}</span>
                    </span>
                    <span className="w-px h-6 bg-blue-700"></span>
                    <span className="text-green-300 flex flex-col md:flex-row items-center gap-1 md:gap-2 leading-tight">
                    <span className="text-[10px] md:text-xs uppercase tracking-wider opacity-70">Esatte</span>
                    <span className="font-bold">{currentCorrect}/{questions.length}</span>
                    </span>
                </div>
            ) : (
                <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                    <Timer className="w-5 h-5" />
                    {formatTime(timeLeft)}
                </div>
            )}
            <button onClick={() => setShowPalette(!showPalette)} className="md:hidden p-2 hover:bg-blue-800 rounded">
                <Grid className="w-5 h-5" />
            </button>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Palette */}
            <aside className={`${showPalette ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 fixed md:relative right-0 top-14 bottom-0 md:top-0 w-64 bg-slate-200 border-l border-slate-300 shadow-xl md:shadow-none z-10 transition-transform duration-200 flex flex-col`}>
            <div className="p-4 bg-slate-300 font-bold text-slate-700 text-sm border-b border-slate-400">ELENCO DOMANDE</div>
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-4 gap-2">
                {questions.map((_, idx) => {
                    const isCurrent = idx === currentIndex;
                    const hasAns = answers[idx] !== -1;
                    const isCorrect = checkAnswerCorrectness(idx);
                    const isFlagged = isAnswered[idx];
                    let bgClass = "bg-white border-slate-400 text-slate-700";
                    if (config.mode === TestMode.ALLENAMENTO && isFlagged) {
                    bgClass = isCorrect ? "bg-green-600 text-white border-green-700" : "bg-red-600 text-white border-red-700";
                    } else if (hasAns) bgClass = "bg-blue-600 text-white border-blue-700";
                    if (isCurrent) bgClass += " ring-2 ring-yellow-400 ring-offset-1";
                    return (
                    <button key={idx} onClick={() => { setCurrentIndex(idx); setShowPalette(false); window.speechSynthesis.cancel(); setIsSpeaking(false); }} className={`h-10 w-full rounded font-bold text-sm border flex items-center justify-center ${bgClass}`}>
                        {idx + 1}
                    </button>
                    );
                })}
                </div>
            </div>
            <div className="p-4 border-t border-slate-300 bg-slate-200">
                <button onClick={finishTest} className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-sm text-sm">TERMINA PROVA</button>
            </div>
            </aside>

            {/* Content */}
            <main className="flex-1 flex flex-col md:flex-row bg-white relative">
            {/* Context Panel */}
            {currentQ.contextText && (
                <div className="md:w-1/2 h-full overflow-y-auto border-r-4 border-slate-200 p-6 md:p-8 bg-slate-50">
                <div className="max-w-prose mx-auto">
                    <div className="flex justify-between items-center mb-4">
                      <div className="inline-block px-3 py-1 bg-slate-200 text-slate-600 font-bold text-xs rounded">
                        {currentQ.audioScript ? "AUDIO SCRIPT" : "TESTO DI RIFERIMENTO"}
                      </div>
                      
                      {/* Audio Button */}
                      {currentQ.audioScript && (
                        <button 
                          onClick={toggleSpeech}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${
                            isSpeaking 
                              ? 'bg-red-100 text-red-600 border border-red-200 animate-pulse' 
                              : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                          }`}
                        >
                          {isSpeaking ? (
                            <> <StopCircle className="w-5 h-5" /> Stop Audio </>
                          ) : (
                            <> <Volume2 className="w-5 h-5" /> Ascolta Traccia </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="prose prose-slate prose-lg text-slate-800 leading-relaxed font-serif whitespace-pre-line">
                    {currentQ.contextText}
                    </div>
                </div>
                </div>
            )}

            {/* Question Panel */}
            <div className={`flex-1 h-full overflow-y-auto p-6 md:p-8 ${!currentQ.contextText ? 'max-w-4xl mx-auto' : ''}`}>
                <div className="mb-8">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-blue-900">Domanda {currentIndex + 1}</h2>
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">{currentQ.topic}</span>
                </div>
                {currentQ.audioScript && !currentQ.contextText && (
                   <div className="mb-4 flex justify-center">
                      <button 
                          onClick={toggleSpeech}
                          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg shadow-sm transition-all ${
                            isSpeaking 
                              ? 'bg-red-600 text-white animate-pulse' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isSpeaking ? <StopCircle className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                          {isSpeaking ? "Interrompi Ascolto" : "Avvia Ascolto (Listening)"}
                        </button>
                   </div>
                )}
                {currentQ.illustration && (
                    <div className="mb-6 flex justify-center p-4 bg-white rounded-lg border border-slate-200 shadow-sm" dangerouslySetInnerHTML={{ __html: currentQ.illustration }} />
                )}
                <p className="text-lg md:text-xl text-slate-900 leading-relaxed font-medium">{currentQ.text}</p>
                </div>

                {currentQ.type === QuestionType.MATRIX && currentQ.matrixRows && currentQ.matrixCols ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-300 text-sm md:text-base">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="p-3 text-left border border-slate-300 w-1/2 text-slate-600">Voce / Paragrafo</th>
                                    {currentQ.matrixCols.map((col, cIdx) => (
                                        <th key={cIdx} className="p-3 text-center border border-slate-300 text-slate-700 w-24">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentQ.matrixRows.map((rowText, rIdx) => {
                                    const matrixAns = Array.isArray(answers[currentIndex]) ? answers[currentIndex] : [];
                                    const currentSelection = matrixAns[rIdx] !== undefined ? matrixAns[rIdx] : -1;
                                    const showResult = config.mode === TestMode.ALLENAMENTO && isAnswered[currentIndex];
                                    const correctCol = currentQ.matrixCorrectAnswer?.[rIdx];
                                    const isRowCorrect = currentSelection === correctCol;
                                    return (
                                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                            <td className="p-3 border border-slate-300 text-slate-800 font-medium">
                                                {rowText}
                                                {showResult && !isRowCorrect && <div className="text-xs text-red-600 mt-1">Corretto: {currentQ.matrixCols?.[correctCol!]}</div>}
                                            </td>
                                            {currentQ.matrixCols?.map((_, cIdx) => {
                                                const isSelected = currentSelection === cIdx;
                                                let cellClass = "cursor-pointer hover:bg-slate-100";
                                                if (showResult) {
                                                    if (cIdx === correctCol) cellClass = "bg-green-100";
                                                    else if (isSelected) cellClass = "bg-red-100";
                                                }
                                                return (
                                                    <td key={cIdx} onClick={() => handleMatrixSelect(rIdx, cIdx)} className={`p-3 border border-slate-300 text-center align-middle ${cellClass}`}>
                                                        <div className="flex justify-center items-center h-full">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-slate-300'} ${showResult && cIdx === correctCol ? '!border-green-600 !bg-green-600' : ''} ${showResult && isSelected && cIdx !== correctCol ? '!border-red-500 !bg-red-500' : ''}`}>
                                                                {isSelected && !showResult && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                                                {showResult && cIdx === correctCol && <Check className="w-3 h-3 text-white" />}
                                                                {showResult && isSelected && cIdx !== correctCol && <X className="w-3 h-3 text-white" />}
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-2xl">
                    {currentQ.options?.map((option, idx) => {
                    const isSelected = answers[currentIndex] === idx;
                    const isCorrect = idx === currentQ.correctAnswerIndex;
                    const showResult = config.mode === TestMode.ALLENAMENTO && isAnswered[currentIndex];
                    let containerClass = "border-slate-300 hover:border-blue-400 hover:bg-blue-50";
                    let dotClass = "border-slate-400";
                    if (showResult) {
                        if (isCorrect) containerClass = "border-green-500 bg-green-50";
                        else if (isSelected) containerClass = "border-red-500 bg-red-50";
                        else containerClass = "border-slate-200 opacity-50";
                    } else if (isSelected) {
                        containerClass = "border-blue-600 bg-blue-50 shadow-sm";
                        dotClass = "border-blue-600 bg-blue-600";
                    }
                    return (
                        <button key={idx} onClick={() => handleSelectOption(idx)} disabled={showResult} className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-start gap-3 ${containerClass}`}>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${dotClass}`}>
                            {isSelected && !showResult && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                            {showResult && isCorrect && <Check className="w-3.5 h-3.5 text-green-600" />}
                            {showResult && isSelected && !isCorrect && <X className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="text-base text-slate-800 font-medium">
                            <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}</span>
                            {option}
                        </div>
                        </button>
                    );
                    })}
                </div>
                )}

                {config.mode === TestMode.ALLENAMENTO && (
                <div className="mt-8">
                    {!isAnswered[currentIndex] ? (
                    <button onClick={confirmAnswerTraining} disabled={answers[currentIndex] === -1} className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Conferma Risposta</button>
                    ) : (
                    <div className={`p-4 rounded-lg border-l-4 ${checkAnswerCorrectness(currentIndex) ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                        <h4 className="font-bold mb-1 flex items-center gap-2">
                        {checkAnswerCorrectness(currentIndex) ? <span className="text-green-700 flex items-center gap-2"><Check className="w-5 h-5"/> Risposta Corretta</span> : <span className="text-red-700 flex items-center gap-2"><X className="w-5 h-5"/> Risposta Errata</span>}
                        </h4>
                        <p className="text-slate-700 text-sm leading-relaxed mt-2"><span className="font-bold block text-slate-900 mb-1">Spiegazione:</span>{currentQ.explanation}</p>
                    </div>
                    )}
                </div>
                )}
            </div>
            </main>
        </div>
        
        {/* Footer */}
        <footer className="bg-slate-100 border-t border-slate-300 h-16 flex items-center justify-between px-6 shrink-0 z-20">
            <button onClick={() => {setCurrentIndex(prev => Math.max(0, prev - 1)); window.speechSynthesis.cancel(); setIsSpeaking(false);}} disabled={currentIndex === 0} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded shadow-sm hover:bg-slate-50 disabled:opacity-50"><ArrowLeft className="w-4 h-4" /> Indietro</button>
            <span className="font-mono font-bold text-slate-500">{currentIndex + 1} / {questions.length}</span>
            <button onClick={() => {setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1)); window.speechSynthesis.cancel(); setIsSpeaking(false);}} disabled={currentIndex === questions.length - 1} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400">Avanti <ArrowRight className="w-4 h-4" /></button>
        </footer>
      </div>

      {/* --- PRINT MODE ONLY --- */}
      <div className="hidden print:block p-8 bg-white text-black">
        <div className="mb-8 border-b-2 border-black pb-4">
            <h1 className="text-3xl font-bold mb-2">Prova di {config.subject}</h1>
            <div className="flex justify-between text-lg font-medium">
                <span>Livello: {config.grade}</span>
                <span>Data: {new Date().toLocaleDateString()}</span>
            </div>
        </div>

        {questions.map((q, idx) => {
            const showContext = idx === 0 || q.contextText !== questions[idx - 1].contextText;
            return (
                <div key={q.id} className="mb-10 break-inside-avoid-page">
                    <div className="flex items-baseline gap-3 mb-3">
                        <span className="font-bold text-xl">Domanda {idx + 1}</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-300 text-gray-600 uppercase tracking-wide">{q.topic}</span>
                    </div>

                    {q.contextText && showContext && (
                        <div className="mb-4 p-4 bg-gray-50 border-l-4 border-gray-400 italic text-gray-800 whitespace-pre-line text-sm leading-relaxed">
                            {q.contextText}
                        </div>
                    )}

                    {q.illustration && (
                        <div className="mb-4 flex justify-center border border-gray-200 p-2 rounded" dangerouslySetInnerHTML={{ __html: q.illustration }} />
                    )}

                    <p className="text-lg mb-4 font-medium leading-relaxed">{q.text}</p>

                    {q.type === QuestionType.MATRIX ? (
                        <table className="w-full border-collapse border border-black text-sm">
                            <thead>
                                <tr>
                                    <th className="border border-black p-2 text-left bg-gray-100 w-1/2">Affermazione</th>
                                    {q.matrixCols?.map(col => <th key={col} className="border border-black p-2 w-16 text-center bg-gray-100">{col}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {q.matrixRows?.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                        <td className="border border-black p-2">{row}</td>
                                        {q.matrixCols?.map((_, cIdx) => (
                                            <td key={cIdx} className="border border-black p-2 text-center">
                                                <div className="w-4 h-4 border border-black rounded-full mx-auto"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="space-y-3 ml-2">
                            {q.options?.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-start gap-3">
                                    <div className="w-6 h-6 border-2 border-black rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-sm font-bold">{String.fromCharCode(65 + oIdx)}</span>
                                    </div>
                                    <span className="text-base leading-relaxed">{opt}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default TestRunner;