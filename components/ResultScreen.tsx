import React from 'react';
import { TestResult, QuestionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { CheckCircle, XCircle, Clock, RefreshCw, Home, Check, X } from 'lucide-react';

interface Props {
  result: TestResult;
  onRestart: () => void;
  onHome: () => void;
}

const ResultScreen: React.FC<Props> = ({ result, onRestart, onHome }) => {
  const data = [
    { name: 'Corrette', value: result.correctAnswers },
    { name: 'Errate/Omesse', value: result.totalQuestions - result.correctAnswers },
  ];
  const COLORS = ['#10b981', '#ef4444'];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Stats */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Risultato Simulazione</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            {/* Chart */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Score Text */}
            <div className="text-center">
              <span className="block text-slate-500 text-sm font-medium uppercase tracking-wide">Punteggio Totale</span>
              <div className={`text-6xl font-extrabold ${getScoreColor(result.scorePercentage)} my-2`}>
                {result.scorePercentage}%
              </div>
              <p className="text-slate-600">
                {result.correctAnswers} su {result.totalQuestions} risposte corrette
              </p>
            </div>

            {/* Time */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Clock className="w-8 h-8 text-indigo-500 mb-2" />
              <span className="text-slate-500 text-sm">Tempo Impiegato</span>
              <span className="text-xl font-bold text-slate-800">{formatTime(result.timeElapsed)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <button onClick={onRestart} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              <RefreshCw className="w-4 h-4" /> Nuova Simulazione
            </button>
            <button onClick={onHome} className="flex items-center gap-2 px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
              <Home className="w-4 h-4" /> Torna alla Home
            </button>
          </div>
        </div>

        {/* Detailed Review */}
        <h3 className="text-xl font-bold text-slate-800 mb-4">Revisione Dettagliata</h3>
        <div className="space-y-6">
          {result.questions.map((q, idx) => {
            const userAns = result.answers[idx];
            let isCorrect = false;
            
            if (q.type === QuestionType.MATRIX) {
                 if (Array.isArray(userAns) && q.matrixCorrectAnswer) {
                     isCorrect = userAns.length === q.matrixCorrectAnswer.length && 
                                 userAns.every((val: number, i: number) => val === q.matrixCorrectAnswer![i]);
                 }
            } else {
                 isCorrect = userAns === q.correctAnswerIndex;
            }

            const isSkipped = userAns === -1 || (Array.isArray(userAns) && userAns.every((a:number) => a === -1));

            return (
              <div key={q.id} className={`bg-white rounded-xl shadow-sm border-l-4 p-6 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="mt-1">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                     <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-slate-500">Domanda {idx + 1}</span>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{q.topic}</span>
                     </div>
                    <p className="text-lg font-medium text-slate-800 mb-2">{q.text}</p>
                    
                    {q.contextText && (
                        <div className="mb-4 p-3 bg-slate-50 border-l-2 border-slate-300 text-sm text-slate-600 italic line-clamp-3 hover:line-clamp-none cursor-pointer" title="Clicca per espandere">
                            {q.contextText}
                        </div>
                    )}
                  </div>
                </div>

                {q.type === QuestionType.MATRIX ? (
                     <div className="mb-4 overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-slate-200">
                             <thead>
                                <tr className="bg-slate-50">
                                    <th className="p-2 border">Affermazione</th>
                                    {q.matrixCols?.map((c, i) => <th key={i} className="p-2 border">{c}</th>)}
                                </tr>
                             </thead>
                             <tbody>
                                 {q.matrixRows?.map((row, rIdx) => {
                                     const userSelection = Array.isArray(userAns) ? userAns[rIdx] : -1;
                                     const correctSelection = q.matrixCorrectAnswer?.[rIdx];

                                     return (
                                         <tr key={rIdx} className="border-b">
                                             <td className="p-2">{row}</td>
                                             {q.matrixCols?.map((_, cIdx) => (
                                                 <td key={cIdx} className="p-2 text-center">
                                                     <div className="flex justify-center">
                                                         {cIdx === correctSelection ? (
                                                             <Check className="w-4 h-4 text-green-600" />
                                                         ) : (
                                                             cIdx === userSelection ? <X className="w-4 h-4 text-red-600" /> : <div className="w-4 h-4" />
                                                         )}
                                                     </div>
                                                 </td>
                                             ))}
                                         </tr>
                                     )
                                 })}
                             </tbody>
                        </table>
                     </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : (isSkipped ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200')}`}>
                            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">La tua risposta</span>
                            <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                            {isSkipped ? "Non risposta" : q.options?.[userAns]}
                            </span>
                        </div>
                        
                        {!isCorrect && (
                            <div className="p-3 rounded border bg-green-50 border-green-200">
                            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Risposta Corretta</span>
                            <span className="font-medium text-green-800">{q.options?.[q.correctAnswerIndex || 0]}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg text-blue-900 text-sm leading-relaxed">
                  <span className="font-bold block mb-1">Spiegazione:</span>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;