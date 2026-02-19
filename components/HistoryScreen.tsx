import React from 'react';
import { TestResult } from '../types';
import { ArrowLeft, Calendar, CheckCircle, Clock } from 'lucide-react';

interface Props {
  history: TestResult[];
  onBack: () => void;
  onReview: (result: TestResult) => void;
}

const HistoryScreen: React.FC<Props> = ({ history, onBack, onReview }) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
           <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Storico Prove</h2>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-lg">Non hai ancora completato nessuna prova.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.sort((a,b) => b.date - a.date).map((test) => (
            <div key={test.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-blue-900">{test.config.subject}</span>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{test.config.grade}</span>
                  <span className={`text-xs px-2 py-0.5 rounded text-white ${test.config.mode === 'allenamento' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                    {test.config.mode}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {new Date(test.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {Math.floor(test.timeElapsed / 60)}m {test.timeElapsed % 60}s</span>
                </div>
              </div>

              <div className="text-right">
                 <div className="text-3xl font-bold text-slate-800 mb-1">
                    {test.scorePercentage}%
                 </div>
                 <div className="text-sm text-slate-500">
                    {test.correctAnswers}/{test.totalQuestions} Corrette
                 </div>
              </div>

              <button 
                onClick={() => onReview(test)}
                className="px-4 py-2 bg-white border border-blue-600 text-blue-600 font-bold rounded hover:bg-blue-50 transition-colors"
              >
                Rivedi
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;