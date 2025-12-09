import React, { useState, useEffect } from 'react';
import WheelChart from './components/WheelChart';
import AnalysisModal from './components/AnalysisModal';
import { CATEGORIES, INITIAL_SCORES, WheelData } from './types';
import { Save, RefreshCw, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [scores, setScores] = useState<Record<string, number>>(INITIAL_SCORES);
  const [notes, setNotes] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('minhaRodaDaVida');
    if (savedData) {
      try {
        const parsed: WheelData = JSON.parse(savedData);
        // Ensure structure is valid even if local storage is old
        const mergedScores = { ...INITIAL_SCORES, ...parsed.scores };
        setScores(mergedScores);
        setNotes(parsed.notes || '');
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      }
    }
    setLoaded(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (loaded) {
      const dataToSave: WheelData = {
        scores,
        notes,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('minhaRodaDaVida', JSON.stringify(dataToSave));
    }
  }, [scores, notes, loaded]);

  const handleScoreChange = (category: string, value: string) => {
    // Allow empty string to temporarily clear input, but don't save NaN
    if (value === '') {
      setScores(prev => ({ ...prev, [category]: 0 }));
      return;
    }

    let intVal = parseInt(value, 10);
    
    if (isNaN(intVal)) {
      intVal = 0;
    } else if (intVal < 0) {
      intVal = 0;
    } else if (intVal > 10) {
      intVal = 10;
    }

    setScores(prev => ({
      ...prev,
      [category]: intVal
    }));
  };

  // Helper for input styling
  const getInputStyles = (val: number) => {
    if (val <= 3) return 'border-red-200 text-red-600 focus:ring-red-200 bg-red-50';
    if (val <= 6) return 'border-yellow-200 text-yellow-600 focus:ring-yellow-200 bg-yellow-50';
    if (val <= 8) return 'border-blue-200 text-blue-600 focus:ring-blue-200 bg-blue-50';
    return 'border-green-200 text-green-600 focus:ring-green-200 bg-green-50';
  };

  const getGradient = (val: number) => {
      // Create a gradient string for the slider track
      const percentage = (val / 10) * 100;
      let color = '#ef4444'; // red-500
      if (val > 3) color = '#eab308'; // yellow-500
      if (val > 6) color = '#3b82f6'; // blue-500
      if (val > 8) color = '#22c55e'; // green-500

      // The gradient simulates the filled part of the track
      return `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
  };

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
              R
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
              Minha Roda da Vida
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Save className="w-3 h-3" />
            <span className="hidden sm:inline">Salvo automaticamente</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Top Section: Chart & Sliders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Chart Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100 flex flex-col items-center justify-center sticky lg:top-24">
             <div className="w-full mb-4 flex justify-between items-center px-2">
                <h2 className="text-lg font-bold text-slate-700">Visão Geral</h2>
                <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-500">Hoje</span>
             </div>
             <WheelChart scores={scores} />
             <p className="text-center text-xs text-slate-400 mt-4 max-w-xs">
                Quanto mais redonda e ampla for sua roda, mais equilibrada está sua vida.
             </p>
          </div>

          {/* Sliders Grid */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-slate-800">Avalie suas Áreas</h2>
                <div className="h-px flex-1 bg-slate-200 ml-4"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORIES.map((category) => (
                <div key={category} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3 gap-2">
                    <label className="text-sm font-semibold text-slate-700 truncate flex-1" title={category}>
                      {category.split('&')[0]} <span className="text-slate-400 font-normal">& {category.split('&')[1]}</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={scores[category]}
                      onChange={(e) => handleScoreChange(category, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className={`w-14 h-10 text-center font-bold text-lg rounded-lg border-2 focus:ring-4 transition-all outline-none ${getInputStyles(scores[category])}`}
                    />
                  </div>
                  
                  <div className="relative w-full h-8 flex items-center">
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={scores[category]}
                        onChange={(e) => handleScoreChange(category, e.target.value)}
                        style={{ background: getGradient(scores[category]) }}
                        className="w-full appearance-none focus:outline-none bg-transparent"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                    <span>Crítico (0)</span>
                    <span>Pleno (10)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
                <RefreshCw className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-800">Notas do Momento</h2>
                <p className="text-xs text-slate-500">Desabafe, escreva metas ou o porquê das notas acima.</p>
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Como você está se sentindo hoje? O que aconteceu para você dar essas notas? Escreva livremente..."
            className="w-full h-40 p-4 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-y text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </main>

      {/* Floating Action Button (CTA) */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-40 pointer-events-none">
        <button
          onClick={() => setIsModalOpen(true)}
          className="pointer-events-auto shadow-2xl shadow-indigo-500/30 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-full flex items-center gap-3 transform hover:scale-105 transition-all duration-300 group"
        >
          <div className="relative">
            <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />
            <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-30"></div>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pronto?</span>
            <span className="font-bold text-lg leading-none">FALA NA LATA</span>
          </div>
        </button>
      </div>

      <AnalysisModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scores={scores}
        notes={notes}
      />
    </div>
  );
};

export default App;