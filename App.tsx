
import React, { useState, useEffect, useRef } from 'react';
import WheelChart from './components/WheelChart';
import AnalysisModal from './components/AnalysisModal';
import { CATEGORIES, INITIAL_SCORES, WheelData, AnalysisRecord, Category, SmartGoal } from './types';
import { Save, RefreshCw, Zap, AlertTriangle, History, Download, Trash2, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [scores, setScores] = useState<Record<string, number>>(INITIAL_SCORES);
  const [notes, setNotes] = useState<string>('');
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Ref for the chart container to capture for PDF
  const chartRef = useRef<HTMLDivElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('minhaRodaDaVida');
    const savedHistory = localStorage.getItem('historicoAnalises');
    
    // Load History
    if (savedHistory) {
        try {
            const parsedHistory: AnalysisRecord[] = JSON.parse(savedHistory);
            setHistory(parsedHistory);
            
            // Requirment: "Carregue a última análise salva automaticamente"
            if (!savedData && parsedHistory.length > 0) {
                 const latest = parsedHistory[0];
                 setScores(latest.scores);
                 setNotes(latest.userNotes);
            }
        } catch (e) {
            console.error("Erro ao carregar histórico", e);
        }
    }

    // Load Draft (Active State)
    if (savedData) {
      try {
        const parsed: WheelData = JSON.parse(savedData);
        const mergedScores = { ...INITIAL_SCORES, ...parsed.scores };
        setScores(mergedScores);
        setNotes(parsed.notes || '');
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      }
    }
    
    setLoaded(true);
  }, []);

  // Save draft to local storage on change
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

  // Save history to local storage whenever it changes
  useEffect(() => {
      if (loaded) {
          localStorage.setItem('historicoAnalises', JSON.stringify(history));
      }
  }, [history, loaded]);

  const handleScoreChange = (category: string, value: string) => {
    if (value === '') {
      setScores(prev => ({ ...prev, [category]: 0 }));
      return;
    }

    let intVal = parseInt(value, 10);
    
    if (isNaN(intVal)) intVal = 0;
    else if (intVal < 0) intVal = 0;
    else if (intVal > 10) intVal = 10;

    setScores(prev => ({
      ...prev,
      [category]: intVal
    }));
  };

  const saveAnalysisToHistory = (resultText: string): AnalysisRecord => {
    const now = new Date();
    const formattedDate = now.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const values = Object.values(scores) as number[];
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    const newRecord: AnalysisRecord = {
        id: crypto.randomUUID(),
        timestamp: now.toISOString(),
        formattedDate,
        scores: { ...scores },
        userNotes: notes,
        aiResponse: resultText,
        averageScore: parseFloat(average.toFixed(1))
    };

    setHistory(prev => [newRecord, ...prev]);
    return newRecord;
  };

  const updateHistoryRecord = (id: string, updates: Partial<AnalysisRecord>) => {
    setHistory(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    }));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('Tem certeza que deseja excluir esta análise do histórico?')) {
          setHistory(prev => prev.filter(item => item.id !== id));
      }
  };

  const viewHistoryItem = (record: AnalysisRecord) => {
      setScores(record.scores);
      setNotes(record.userNotes);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // PDF Generation Logic
  const generatePDF = async (record: AnalysisRecord) => {
      // 1. Capture Chart
      let chartImgData = '';
      if (chartRef.current) {
          const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
          chartImgData = canvas.toDataURL('image/png');
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Header
      doc.setFontSize(22);
      doc.setTextColor(40, 50, 70);
      doc.text("Minha Roda da Vida", margin, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Análise de ${record.formattedDate}`, margin, yPos);
      yPos += 15;

      // Chart
      if (chartImgData) {
          const imgWidth = 100;
          const imgHeight = 100;
          const xPos = (pageWidth - imgWidth) / 2;
          doc.addImage(chartImgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 10;
      }

      // Scores Table
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Pontuação por Área", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      const col1X = margin;
      const col2X = pageWidth / 2 + 10;
      
      let i = 0;
      CATEGORIES.forEach((cat) => {
          const x = i % 2 === 0 ? col1X : col2X;
          const score = record.scores[cat];
          doc.text(`${cat}: ${score}/10`, x, yPos);
          if (i % 2 !== 0) yPos += 8;
          i++;
      });
      if (i % 2 !== 0) yPos += 8;
      yPos += 10;

      // User Notes
      if (record.userNotes) {
        doc.setFontSize(14);
        doc.text("Suas Notas", margin, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        
        const splitNotes = doc.splitTextToSize(record.userNotes, pageWidth - (margin * 2));
        doc.text(splitNotes, margin, yPos);
        yPos += (splitNotes.length * 5) + 15;
      }

      // Check page break for Analysis
      if (yPos > 250) {
          doc.addPage();
          yPos = 20;
      }

      // AI Analysis
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Análise da IA", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      // Clean markdown slightly
      const cleanAnalysis = record.aiResponse.replace(/\*\*/g, '').replace(/##/g, '').replace(/\*/g, '•');
      const splitAnalysis = doc.splitTextToSize(cleanAnalysis, pageWidth - (margin * 2));
      doc.text(splitAnalysis, margin, yPos);
      yPos += (splitAnalysis.length * 5) + 15;

      // SMART Goals (New Section)
      if (record.smartGoals && record.smartGoals.length > 0) {
          if (yPos > 240) { doc.addPage(); yPos = 20; }
          
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text("Metas SMART Prioritárias", margin, yPos);
          yPos += 10;

          record.smartGoals.forEach(sg => {
              // Check space
              if (yPos > 270) { doc.addPage(); yPos = 20; }
              
              doc.setFontSize(11);
              doc.setTextColor(79, 70, 229); // Indigo color for area
              doc.setFont("helvetica", "bold");
              doc.text(sg.area, margin, yPos);
              yPos += 5;
              
              doc.setFontSize(10);
              doc.setTextColor(60, 60, 60);
              doc.setFont("helvetica", "normal");
              const splitGoal = doc.splitTextToSize(sg.goal, pageWidth - (margin * 2));
              doc.text(splitGoal, margin, yPos);
              yPos += (splitGoal.length * 5) + 6;
          });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for(let p = 1; p <= pageCount; p++) {
          doc.setPage(p);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text("Gerado por Minha Roda da Vida", pageWidth / 2, 290, { align: 'center' });
      }

      doc.save(`roda-da-vida-${record.formattedDate.replace(/\//g, '-').replace(/:/g, '-')}.pdf`);
  };

  const getSabotageMessage = () => {
    const values = Object.values(scores) as number[];
    const minVal = Math.min(...values);
    const lowestCategories = CATEGORIES.filter(cat => scores[cat] === minVal);

    let message = "";
    if (lowestCategories.length === 1) {
      message = `Sua maior sabotagem agora é ${lowestCategories[0]}.`;
    } else if (lowestCategories.length === 2) {
      message = `Suas maiores sabotagens agora são ${lowestCategories[0]} e ${lowestCategories[1]}.`;
    } else {
      const top3 = lowestCategories.slice(0, 3);
      message = `Suas maiores sabotagens agora são ${top3[0]}, ${top3[1]} e ${top3[2]}.`;
    }
    return `${message} Quer mesmo continuar assim?`;
  };

  const getInputStyles = (val: number) => {
    if (val <= 3) return 'border-red-200 text-red-600 focus:ring-red-200 bg-red-50';
    if (val <= 6) return 'border-yellow-200 text-yellow-600 focus:ring-yellow-200 bg-yellow-50';
    if (val <= 8) return 'border-blue-200 text-blue-600 focus:ring-blue-200 bg-blue-50';
    return 'border-green-200 text-green-600 focus:ring-green-200 bg-green-50';
  };

  const getGradient = (val: number) => {
      const percentage = (val / 10) * 100;
      let color = '#ef4444';
      if (val > 3) color = '#eab308';
      if (val > 6) color = '#3b82f6';
      if (val > 8) color = '#22c55e';
      return `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
  };

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
              R
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
              Minha Roda da Vida
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
             {history.length > 0 && (
                 <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                     Você já fez {history.length} {history.length === 1 ? 'análise' : 'análises'} profundas
                 </span>
             )}
            <div className="flex items-center gap-1 text-slate-400">
                <Save className="w-3 h-3" />
                <span className="hidden sm:inline">Salvo auto</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* SABOTAGE ALERT */}
        <div className="w-full bg-[#ffebee] border-l-[6px] border-[#d32f2f] rounded-r-xl p-6 shadow-sm flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
          <AlertTriangle className="w-8 h-8 text-[#d32f2f] flex-shrink-0 mt-0.5" />
          <p className="text-[#b71c1c] text-lg font-bold leading-snug">
            {getSabotageMessage()}
          </p>
        </div>

        {/* Top Section: Chart & Sliders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Chart Card */}
          <div ref={chartRef} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100 flex flex-col items-center justify-center sticky lg:top-24">
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

        {/* History Section */}
        {history.length > 0 && (
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <History className="w-5 h-5 text-slate-400" />
                    <h2 className="text-xl font-bold text-slate-800">Histórico de Evolução</h2>
                </div>

                <div className="space-y-3">
                    {history.map((record) => (
                        <div key={record.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all hover:shadow-md">
                            <div 
                                onClick={() => setExpandedHistoryId(expandedHistoryId === record.id ? null : record.id)}
                                className="p-4 flex items-center justify-between cursor-pointer bg-slate-50 hover:bg-white transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <span className="font-bold text-slate-700 text-sm sm:text-base">{record.formattedDate}</span>
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-semibold">
                                        Média: {record.averageScore}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400">
                                    {expandedHistoryId === record.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            </div>
                            
                            {expandedHistoryId === record.id && (
                                <div className="p-4 border-t border-slate-100 bg-white animate-in slide-in-from-top-2">
                                    <div className="mb-3">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Resumo da IA:</p>
                                        <p className="text-sm text-slate-600 line-clamp-2 italic border-l-2 border-indigo-200 pl-3">
                                            "{record.aiResponse.substring(0, 150)}..."
                                        </p>
                                        {record.smartGoals && record.smartGoals.length > 0 && (
                                            <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                                                <Zap className="w-3 h-3" />
                                                Contém {record.smartGoals.length} Metas SMART
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <button 
                                            onClick={() => viewHistoryItem(record)}
                                            className="text-xs flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                                        >
                                            <Eye className="w-3 h-3" />
                                            Ver e Editar
                                        </button>
                                        <button 
                                            onClick={() => generatePDF(record)}
                                            className="text-xs flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors"
                                        >
                                            <Download className="w-3 h-3" />
                                            Exportar PDF
                                        </button>
                                        <button 
                                            onClick={(e) => deleteHistoryItem(record.id, e)}
                                            className="text-xs flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors ml-auto"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
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
        onAnalysisComplete={saveAnalysisToHistory}
        onExportPDF={generatePDF}
        onUpdateRecord={updateHistoryRecord}
      />
    </div>
  );
};

export default App;
