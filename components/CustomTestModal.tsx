import React, { useState, useRef } from 'react';
import { Subject, GradeLevel, TestConfig } from '../types';
import { X, UploadCloud, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (baseConfig: Omit<TestConfig, 'mode'>, customText: string) => void;
}

const CustomTestModal: React.FC<Props> = ({ isOpen, onClose, onGenerate }) => {
  const [text, setText] = useState('');
  const [subject, setSubject] = useState<Subject>(Subject.ITALIANO);
  const [grade, setGrade] = useState<GradeLevel>(GradeLevel.SECONDA_SUPERIORE);
  const [count, setCount] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        setText(fileContent);
        setError(null);
      };
      reader.onerror = () => {
        setError("Impossibile leggere il file.");
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateClick = async () => {
    if (!text.trim()) {
      setError("Il testo non può essere vuoto.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      await onGenerate({ subject, grade, questionCount: count }, text);
      // The parent will handle closing and state change
    } catch (e) {
      setError("Si è verificato un errore durante la generazione.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="p-4 flex justify-between items-center border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Crea Prova Personalizzata con AI</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </header>
        
        <main className="p-6 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Testo di Riferimento</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Incolla qui il tuo testo (es. un articolo, un brano, appunti) oppure carica un file."
              className="w-full h-48 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
            />
          </div>
          
          <div className="text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".txt,.md"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 text-sm font-medium"
            >
              <UploadCloud className="w-4 h-4" />
              Carica file (.txt, .md)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
             <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Materia</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {Object.values(Subject).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
             </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Livello</label>
                <select 
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as GradeLevel)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {Object.values(GradeLevel).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">N. Domande</label>
                <select 
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value={3}>3 Domande</option>
                  <option value={5}>5 Domande</option>
                  <option value={10}>10 Domande</option>
                </select>
              </div>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        </main>
        
        <footer className="p-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={handleGenerateClick}
            disabled={isLoading || !text.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              'Genera Prova e Inizia'
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CustomTestModal;
