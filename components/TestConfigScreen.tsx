import React, { useState } from 'react';
import { Subject, GradeLevel, TestConfig, TestMode } from '../types';
import { BookOpen, Calculator, Languages, GraduationCap, PlayCircle, Clock, Zap, History, Sparkles, Download, Scale } from 'lucide-react';
import { getStaticQuestions } from '../services/questionBank';

interface Props {
  onStart: (config: TestConfig) => void;
  onViewHistory: () => void;
  onOpenCustomModal: () => void;
}

const TestConfigScreen: React.FC<Props> = ({ onStart, onViewHistory, onOpenCustomModal }) => {
  const [subject, setSubject] = useState<Subject>(Subject.MATEMATICA);
  const [grade, setGrade] = useState<GradeLevel>(GradeLevel.SECONDA_SUPERIORE);
  const [count, setCount] = useState<number>(10);
  const [mode, setMode] = useState<TestMode>(TestMode.ALLENAMENTO);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({ subject, grade, questionCount: count, mode });
  };

  const handleDownloadApp = () => {
    const questionsForOffline = getStaticQuestions(subject, grade).slice(0, count);

    if (questionsForOffline.length === 0) {
      alert(`Nessuna domanda offline disponibile per ${subject} - ${grade}. Prova a selezionare un'altra combinazione o un numero inferiore di domande.`);
      return;
    }

    const configForOffline = { subject, grade, count: questionsForOffline.length, mode };

    const reactAppScript = `
      const { useState, useMemo, useEffect } = React;
      const { createRoot } = ReactDOM;
      
      const questions = ${JSON.stringify(questionsForOffline, null, 2)};
      const config = ${JSON.stringify(configForOffline, null, 2)};

      const formatTime = (seconds) => {
        if (seconds > 360000) return '';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return \`\${m}:\${s.toString().padStart(2, '0')}\`;
      };
      
      const checkAnswerCorrectness = (q, ans) => {
         if (ans === -1 || ans === undefined) return false;
         if (q.type === 'matrix') {
            if (!Array.isArray(ans) || !q.matrixCorrectAnswer) return false;
            return ans.length === q.matrixCorrectAnswer.length && ans.every((val, i) => val === q.matrixCorrectAnswer[i]);
         } else {
            return ans === q.correctAnswerIndex;
         }
      };

      const OfflineQuiz = () => {
        const [currentIndex, setCurrentIndex] = useState(0);
        const [answers, setAnswers] = useState(new Array(questions.length).fill(-1));
        const [isFinished, setIsFinished] = useState(false);
        const [isAnswered, setIsAnswered] = useState(new Array(questions.length).fill(false));
        const [timeLeft, setTimeLeft] = useState(config.mode === 'simulazione' ? 90 * 60 : 999999);
        const startTime = useMemo(() => Date.now(), []);

        const finishTest = () => setIsFinished(true);

        useEffect(() => {
            if (config.mode !== 'simulazione' || isFinished) return;
            const timer = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  clearInterval(timer);
                  finishTest();
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
            return () => clearInterval(timer);
        }, [isFinished]);

        const score = useMemo(() => {
          if (!isFinished) return 0;
          return questions.reduce((acc, q, idx) => acc + (checkAnswerCorrectness(q, answers[idx]) ? 1 : 0), 0);
        }, [isFinished, answers]);

        const currentQ = questions[currentIndex];
        
        const handleAnswerSelect = (ans) => {
          if (config.mode === 'allenamento' && isAnswered[currentIndex]) return;
          setAnswers(prev => {
            const newAns = [...prev];
            newAns[currentIndex] = ans;
            return newAns;
          });
        };
        
        const handleMatrixSelect = (rIndex, cIndex) => {
            if (config.mode === 'allenamento' && isAnswered[currentIndex]) return;
            const currentAns = answers[currentIndex] === -1 ? new Array(currentQ.matrixRows.length).fill(-1) : [...answers[currentIndex]];
            currentAns[rIndex] = cIndex;
            handleAnswerSelect(currentAns);
        };
        
        const confirmAnswerTraining = () => {
            if (answers[currentIndex] === -1) return;
            setIsAnswered(prev => {
                const newIsAnswered = [...prev];
                newIsAnswered[currentIndex] = true;
                return newIsAnswered;
            });
        };

        if (isFinished) {
          const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
          const finalTime = config.mode === 'simulazione' ? (90 * 60) - timeLeft : timeElapsed;
          
          return React.createElement('div', { className: 'p-8 max-w-3xl mx-auto' },
            React.createElement('h1', { className: 'text-3xl font-bold text-center mb-4' }, 'Prova Terminata'),
            React.createElement('div', { className: 'bg-white p-8 rounded-lg shadow-md text-center' },
              React.createElement('p', { className: 'text-lg text-slate-600' }, 'Il tuo punteggio è:'),
              React.createElement('p', { className: 'text-6xl font-bold my-4 text-blue-700' }, \`\${score} / \${questions.length}\`),
              React.createElement('p', { className: 'text-slate-500' }, \`Tempo impiegato: \${formatTime(finalTime)}\`),
              React.createElement('button', {
                onClick: () => { 
                  setIsFinished(false); 
                  setAnswers(new Array(questions.length).fill(-1)); 
                  setIsAnswered(new Array(questions.length).fill(false)); 
                  setCurrentIndex(0); 
                  setTimeLeft(config.mode === 'simulazione' ? 90 * 60 : 999999); 
                },
                className: 'mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700'
              }, 'Riprova')
            ),
            React.createElement('h2', { className: 'text-2xl font-bold text-center mt-12 mb-4' }, 'Riepilogo Risposte'),
            React.createElement('div', { className: 'space-y-4' }, 
              questions.map((q, idx) => {
                 const isCorrect = checkAnswerCorrectness(q, answers[idx]);
                 return React.createElement('div', { key: q.id, className: \`p-4 rounded-lg \${isCorrect ? 'bg-green-50' : 'bg-red-50'}\` },
                  React.createElement('p', { className: 'font-bold' }, \`\${idx + 1}. \${q.text}\`),
                  React.createElement('p', { className: 'text-sm text-slate-600 mt-2' }, React.createElement('strong', null, 'Spiegazione: '), q.explanation)
                );
              })
            )
          );
        }

        const isCurrentCorrectInTraining = isAnswered[currentIndex] && checkAnswerCorrectness(currentQ, answers[currentIndex]);

        return React.createElement('div', { className: 'p-4 sm:p-8 max-w-4xl mx-auto' },
          React.createElement('header', { className: 'mb-6 text-center' }, 
            React.createElement('h1', { className: 'text-2xl font-bold' }, \`Prova Offline - \${config.subject}\`),
            React.createElement('p', { className: 'text-slate-500' }, \`\${config.grade} - Modalità \${config.mode}\`),
            config.mode === 'simulazione' && React.createElement('div', { className: 'mt-2 font-mono text-xl font-bold \${timeLeft < 300 ? "text-red-500" : ""}' }, formatTime(timeLeft))
          ),
          React.createElement('div', { className: 'bg-white p-6 sm:p-8 rounded-xl shadow-lg' },
            currentQ.contextText && React.createElement('div', { className: 'mb-6 p-4 bg-slate-50 border-l-4 border-slate-300' }, 
              React.createElement('p', { className: 'text-sm text-slate-600 whitespace-pre-line' }, currentQ.contextText)
            ),
            React.createElement('div', { className: 'flex justify-between items-start' },
                React.createElement('h2', { className: 'text-xl font-bold text-blue-900 mb-2' }, \`Domanda \${currentIndex + 1} di \${questions.length}\`),
                React.createElement('span', { className: 'text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded' }, currentQ.topic)
            ),
            currentQ.illustration && React.createElement('div', { className: 'my-4 flex justify-center', dangerouslySetInnerHTML: { __html: currentQ.illustration } }),
            React.createElement('p', { className: 'text-lg text-slate-900 my-4' }, currentQ.text),
            
            currentQ.type === 'matrix' ? (
                React.createElement('table', { className: 'w-full text-sm my-4 border-collapse' },
                    React.createElement('thead', null, React.createElement('tr', {className: 'bg-slate-100'}, 
                        React.createElement('th', {className: 'p-2 text-left border'}),
                        currentQ.matrixCols.map(c => React.createElement('th', {key: c, className:'p-2 border'}, c))
                    )),
                    React.createElement('tbody', null, 
                        currentQ.matrixRows.map((row, rIdx) => React.createElement('tr', { key: rIdx, className: 'border-b'},
                            React.createElement('td', { className: 'p-2 font-medium border' }, row),
                            currentQ.matrixCols.map((_, cIdx) => {
                                const matrixAns = Array.isArray(answers[currentIndex]) ? answers[currentIndex] : [];
                                const isSelected = matrixAns[rIdx] === cIdx;
                                return React.createElement('td', {key: cIdx, className: 'p-2 border text-center'}, 
                                    React.createElement('input', {
                                        type: 'radio',
                                        name: \`\${currentQ.id}-\${rIdx}\`,
                                        checked: isSelected,
                                        onChange: () => handleMatrixSelect(rIdx, cIdx),
                                        disabled: config.mode === 'allenamento' && isAnswered[currentIndex],
                                        className: 'w-5 h-5'
                                    })
                                )
                            })
                        ))
                    )
                )
            ) : (
                 React.createElement('div', { className: 'space-y-3' }, 
                    currentQ.options.map((option, idx) => {
                        const isSelected = answers[currentIndex] === idx;
                        const isCorrect = idx === currentQ.correctAnswerIndex;
                        const showResult = config.mode === 'allenamento' && isAnswered[currentIndex];
                        let buttonClass = 'bg-white hover:bg-slate-50';
                        if (showResult) {
                            if (isCorrect) buttonClass = 'bg-green-100 border-green-500';
                            else if (isSelected) buttonClass = 'bg-red-100 border-red-500';
                            else buttonClass = 'bg-slate-50 opacity-60';
                        } else if (isSelected) {
                            buttonClass = 'bg-blue-100 border-blue-500';
                        }
                        return React.createElement('button', {
                            key: idx,
                            onClick: () => handleAnswerSelect(idx),
                            disabled: showResult,
                            className: \`w-full text-left p-4 rounded-lg border-2 flex items-center gap-3 transition \${buttonClass}\`
                        }, 
                        React.createElement('div', {className: 'w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center font-bold text-sm',}, String.fromCharCode(65 + idx)),
                        React.createElement('span', null, option)
                    )})
                 )
            ),
            config.mode === 'allenamento' && React.createElement('div', { className: 'mt-6' },
                !isAnswered[currentIndex] ? React.createElement('button', {
                    onClick: confirmAnswerTraining,
                    disabled: answers[currentIndex] === -1,
                    className: 'px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50'
                }, 'Conferma Risposta')
                : React.createElement('div', {className: \`p-4 rounded-lg \${isCurrentCorrectInTraining ? 'bg-green-50' : 'bg-red-50'}\`},
                    React.createElement('p', {className: 'font-bold'}, isCurrentCorrectInTraining ? 'Risposta Corretta!' : 'Risposta Errata.'),
                    React.createElement('p', {className: 'text-sm mt-1'}, currentQ.explanation)
                  )
            )
          ),
          React.createElement('div', { className: 'flex justify-between mt-6' },
            React.createElement('button', {
              onClick: () => setCurrentIndex(p => Math.max(0, p - 1)),
              disabled: currentIndex === 0,
              className: 'px-6 py-2 bg-slate-200 font-semibold rounded-lg disabled:opacity-50'
            }, 'Precedente'),
            currentIndex === questions.length - 1 
              ? React.createElement('button', { onClick: finishTest, className: 'px-6 py-2 bg-green-600 text-white font-semibold rounded-lg' }, 'Termina Prova')
              : React.createElement('button', { onClick: () => setCurrentIndex(p => Math.min(questions.length - 1, p + 1)), className: 'px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg' }, 'Successiva')
          )
        );
      };

      createRoot(document.getElementById('root')).render(React.createElement(OfflineQuiz));
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invalsi Test Offline</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <style> body { font-family: 'Inter', sans-serif; background-color: #f1f5f9; } </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">${reactAppScript}</script>
      </body>
      </html>`;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Invalsi_Test_Offline.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const getSubjectIcon = (s: Subject) => {
    switch (s) {
      case Subject.ITALIANO: return <BookOpen className="w-6 h-6 text-emerald-600" />;
      case Subject.MATEMATICA: return <Calculator className="w-6 h-6 text-blue-600" />;
      case Subject.INGLESE: return <Languages className="w-6 h-6 text-rose-600" />;
      case Subject.DIRITTO: return <Scale className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
            Invalsi<span className="text-blue-700">CBT</span> Simulator
          </h1>
          <p className="text-slate-600 mt-2">
            Piattaforma di allenamento conforme alle prove nazionali.
          </p>
        </div>
        <button 
          onClick={onViewHistory}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <History className="w-5 h-5" /> Storico Prove
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-slate-500" /> Configurazione Prova Standard
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* Subjects */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">1. Materia</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.values(Subject).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className={`
                    relative flex flex-col items-center justify-center p-5 rounded-lg border-2 transition-all duration-200
                    ${subject === s 
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm' 
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-600'}
                  `}
                >
                  <div className={`mb-2 p-2 rounded-full ${subject === s ? 'bg-white' : 'bg-slate-100'}`}>
                    {getSubjectIcon(s)}
                  </div>
                  <span className="font-bold">{s}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mode Selection */}
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">2. Modalità</label>
               <div className="space-y-3">
                 <div 
                   onClick={() => setMode(TestMode.ALLENAMENTO)}
                   className={`cursor-pointer p-4 rounded-lg border-2 flex items-start gap-4 transition-all ${mode === TestMode.ALLENAMENTO ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}
                 >
                   <div className={`mt-1 p-1.5 rounded-full ${mode === TestMode.ALLENAMENTO ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                     <Zap className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-800">Allenamento</h3>
                     <p className="text-sm text-slate-600">Feedback immediato domanda per domanda. Ideale per ripassare.</p>
                   </div>
                 </div>

                 <div 
                   onClick={() => setMode(TestMode.SIMULAZIONE)}
                   className={`cursor-pointer p-4 rounded-lg border-2 flex items-start gap-4 transition-all ${mode === TestMode.SIMULAZIONE ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                 >
                    <div className={`mt-1 p-1.5 rounded-full ${mode === TestMode.SIMULAZIONE ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                     <Clock className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-800">Simulazione Reale</h3>
                     <p className="text-sm text-slate-600">Timer 90 minuti. Feedback solo al termine della prova.</p>
                   </div>
                 </div>
               </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">3. Livello</label>
                <select 
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as GradeLevel)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.values(GradeLevel).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">4. Lunghezza</label>
                <select 
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={7}>7 Domande (Sessione Rapida)</option>
                  <option value={10}>10 Domande (Allenamento Standard)</option>
                  <option value={15}>15 Domande (Sessione Media)</option>
                  <option value={30}>30 Domande (Simulazione Completa)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-lg transform transition active:scale-[0.99]"
            >
              <PlayCircle className="w-7 h-7" />
              {mode === TestMode.SIMULAZIONE ? 'Avvia Prova Ufficiale' : 'Inizia Allenamento'}
            </button>
          </div>
        </form>
      </div>

      {/* Custom Test Generator */}
      <div className="mt-8">
        <button 
          onClick={onOpenCustomModal}
          className="w-full p-6 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl text-left hover:border-indigo-400 hover:bg-indigo-100 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-white">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-900">Crea Prova da Testo con AI</h3>
              <p className="text-indigo-700">Incolla un testo o carica un file per generare domande personalizzate.</p>
            </div>
          </div>
        </button>
      </div>

      <button 
          type="button"
          onClick={onViewHistory}
          className="md:hidden w-full mt-4 text-slate-600 font-medium py-2"
        >
          Visualizza Storico Prove
      </button>

      <div className="text-center mt-8 border-t border-slate-200 pt-6">
        <button
          onClick={handleDownloadApp}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-700 hover:underline"
        >
          <Download className="w-4 h-4" />
          Scarica Test Offline
        </button>
      </div>

    </div>
  );
};

export default TestConfigScreen;