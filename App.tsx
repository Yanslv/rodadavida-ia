
import React, { useState, useEffect, useRef } from 'react';
import WheelChart from './components/WheelChart';
import AnalysisModal from './components/AnalysisModal';
import EmailCaptureModal from './components/EmailCaptureModal';
import CheckoutModal from './components/CheckoutModal';
import OnboardingTour, { TourStep } from './components/OnboardingTour';
import { useGlobalMouse, InteractiveBackground, SpotlightEffect, TiltCard } from './components/VisualEffects';
import { CATEGORIES, INITIAL_SCORES, WheelData, AnalysisRecord, CustomWheelData } from './types';
import { RefreshCw, Zap, History, Download, Trash2, ChevronDown, ChevronUp, Eye, Settings, ArrowRight, Star, Lock, CheckCircle2, LayoutGrid, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { captureEmail } from './services/mockApi';

const App: React.FC = () => {
  // Activate global mouse tracking for effects
  useGlobalMouse();

  const [mode, setMode] = useState<'standard' | 'custom'>('standard');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Standard Data
  const [scores, setScores] = useState<Record<string, number>>(INITIAL_SCORES);
  const [notes, setNotes] = useState<string>('');
  
  // Custom Data
  const [customData, setCustomData] = useState<CustomWheelData | null>(null);
  
  // Custom Setup State
  const [isSettingUpCustom, setIsSettingUpCustom] = useState(false);
  const [customStep, setCustomStep] = useState(1);
  const [customAreaCount, setCustomAreaCount] = useState<number>(4);
  const [customAreaNames, setCustomAreaNames] = useState<string[]>([]);
  
  // Common State
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // UX State
  const [isSaving, setIsSaving] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // New Features State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Ref for the chart container to capture for PDF
  const chartRef = useRef<HTMLDivElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('minhaRodaDaVida');
    const savedCustomData = localStorage.getItem('roda_custom');
    const savedHistory = localStorage.getItem('historicoAnalises');
    const savedEmail = localStorage.getItem('userEmail');
    const savedPremium = localStorage.getItem('isPremium');
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    
    if (savedEmail) setUserEmail(savedEmail);
    if (savedPremium === 'true') setIsPremium(true);

    // Show tour if first time
    if (!hasSeenTour) {
        // Small delay to ensure rendering
        setTimeout(() => setShowTour(true), 1500);
    }

    // Load History
    if (savedHistory) {
        try {
            const parsedHistory: AnalysisRecord[] = JSON.parse(savedHistory);
            setHistory(parsedHistory);
            
            // Auto-load latest session
            if (!savedData && !savedCustomData && parsedHistory.length > 0) {
                 const latest = parsedHistory[0];
                 if (latest.mode === 'custom' && latest.categories) {
                    setMode('custom');
                 } else {
                    setScores(latest.scores);
                    setNotes(latest.userNotes);
                 }
            }
        } catch (e) {
            console.error("Erro ao carregar histórico", e);
        }
    }

    // Load Standard Draft
    if (savedData) {
      try {
        const parsed: WheelData = JSON.parse(savedData);
        setScores({ ...INITIAL_SCORES, ...parsed.scores });
        setNotes(parsed.notes || '');
      } catch (e) { console.error(e); }
    }

    // Load Custom Draft
    if (savedCustomData) {
        try {
            const parsed: CustomWheelData = JSON.parse(savedCustomData);
            setCustomData(parsed);
        } catch (e) { console.error(e); }
    }
    
    setLoaded(true);
  }, []);

  // Save standard draft with Auto-save indicator
  useEffect(() => {
    if (loaded && mode === 'standard') {
      setIsSaving(true);
      const dataToSave: WheelData = {
        scores,
        notes,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('minhaRodaDaVida', JSON.stringify(dataToSave));
      
      const timer = setTimeout(() => {
          setIsSaving(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [scores, notes, loaded, mode]);

  // Save custom draft
  useEffect(() => {
    if (loaded && customData) {
        setIsSaving(true);
        localStorage.setItem('roda_custom', JSON.stringify(customData));
        const timer = setTimeout(() => {
            setIsSaving(false);
        }, 800);
        return () => clearTimeout(timer);
    }
  }, [customData, loaded]);

  // Save history
  useEffect(() => {
      if (loaded) {
          localStorage.setItem('historicoAnalises', JSON.stringify(history));
      }
  }, [history, loaded]);

  // Derived Properties for Rendering
  const activeCategories = mode === 'standard' ? CATEGORIES : (customData?.categories || []);
  const activeScores = mode === 'standard' ? scores : (customData?.scores || {});
  const activeNotes = mode === 'standard' ? notes : (customData?.notes || '');

  const handleScoreChange = (category: string, value: string) => {
    const intVal = Math.min(10, Math.max(0, parseInt(value, 10) || 0));
    
    if (mode === 'standard') {
        setScores(prev => ({ ...prev, [category]: intVal }));
    } else if (customData) {
        setCustomData({
            ...customData,
            scores: { ...customData.scores, [category]: intVal }
        });
    }
  };

  const handleNotesChange = (val: string) => {
      if (mode === 'standard') {
          setNotes(val);
      } else if (customData) {
          setCustomData({ ...customData, notes: val });
      }
  };

  const handleModeToggle = () => {
      setIsTransitioning(true);
      setTimeout(() => {
          if (mode === 'standard') {
              setMode('custom');
              // If no custom data exists, start setup
              if (!customData) {
                  setIsSettingUpCustom(true);
                  setCustomStep(1);
              }
          } else {
              setMode('standard');
              setIsSettingUpCustom(false);
          }
          setIsTransitioning(false);
      }, 300); // Wait for fade out
  };

  // Flow Handlers
  const handleAnalyzeClick = () => {
      if (!userEmail) {
          setShowEmailModal(true);
      } else {
          setIsModalOpen(true);
      }
  };

  const handleEmailSuccess = (email: string) => {
      setUserEmail(email);
      localStorage.setItem('userEmail', email);
      setShowEmailModal(false);
      
      // Call mock API
      const wheelData = mode === 'standard' ? { scores, notes } : customData;
      captureEmail(email, wheelData).then(() => {
          setIsModalOpen(true);
      });
  };

  const handleTriggerPremium = () => {
      setShowCheckout(true);
  };

  const handlePaymentSuccess = () => {
      setIsPremium(true);
      localStorage.setItem('isPremium', 'true');
      setShowCheckout(false);
  };

  const handleTourComplete = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setShowTour(false);
  };

  // Custom Setup Logic
  const handleStartCustomSetup = () => {
      const initialNames = Array.from({ length: customAreaCount }, (_, i) => `Área ${i + 1}`);
      setCustomAreaNames(initialNames);
      setCustomStep(2);
  };

  const handleFinishCustomSetup = () => {
      const uniqueNames = customAreaNames.map((name, idx) => {
          const count = customAreaNames.filter((n, i) => i < idx && n === name).length;
          return count > 0 ? `${name} ${count + 1}` : name;
      });

      const initialScores: Record<string, number> = {};
      uniqueNames.forEach(name => initialScores[name] = 5);

      const newCustomData: CustomWheelData = {
          categories: uniqueNames,
          scores: initialScores,
          notes: '',
          lastUpdated: new Date().toISOString()
      };

      setCustomData(newCustomData);
      setIsSettingUpCustom(false);
  };

  const updateCustomName = (index: number, val: string) => {
      const newNames = [...customAreaNames];
      newNames[index] = val;
      setCustomAreaNames(newNames);
  };

  // ------------------------------------------

  const saveAnalysisToHistory = (resultText: string): AnalysisRecord => {
    const now = new Date();
    const formattedDate = now.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const values = Object.values(activeScores) as number[];
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    const newRecord: AnalysisRecord = {
        id: crypto.randomUUID(),
        timestamp: now.toISOString(),
        formattedDate,
        scores: { ...activeScores },
        userNotes: activeNotes,
        aiResponse: resultText,
        averageScore: parseFloat(average.toFixed(1)),
        mode: mode,
        categories: activeCategories
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
      if (record.mode === 'custom') {
          setMode('custom');
          setCustomData({
              categories: record.categories || Object.keys(record.scores),
              scores: record.scores,
              notes: record.userNotes,
              lastUpdated: record.timestamp
          });
      } else {
          setMode('standard');
          setScores(record.scores);
          setNotes(record.userNotes);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generatePDF = async (record: AnalysisRecord) => {
      let chartImgData = '';
      if (chartRef.current) {
          const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
          chartImgData = canvas.toDataURL('image/png');
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // PDF Generation Logic (Same as before)
      doc.setFontSize(22);
      doc.setTextColor(40, 50, 70);
      doc.text("Minha Roda da Vida", margin, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Análise de ${record.formattedDate} (${record.mode === 'custom' ? 'Customizada' : 'Padrão'})`, margin, yPos);
      yPos += 15;
      if (chartImgData) {
          const imgWidth = 100;
          const imgHeight = 100;
          const xPos = (pageWidth - imgWidth) / 2;
          doc.addImage(chartImgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 10;
      }
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Pontuação por Área", margin, yPos);
      yPos += 10;
      doc.setFontSize(10);
      const col1X = margin;
      const col2X = pageWidth / 2 + 10;
      const catsToPrint = record.categories || Object.keys(record.scores);
      let i = 0;
      catsToPrint.forEach((cat) => {
          const x = i % 2 === 0 ? col1X : col2X;
          const score = record.scores[cat];
          doc.text(`${cat}: ${score}/10`, x, yPos);
          if (i % 2 !== 0) yPos += 8;
          i++;
      });
      if (i % 2 !== 0) yPos += 8;
      yPos += 10;
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
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Análise da IA", margin, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      const cleanAnalysis = record.aiResponse.replace(/\*\*/g, '').replace(/##/g, '').replace(/\*/g, '•');
      const splitAnalysis = doc.splitTextToSize(cleanAnalysis, pageWidth - (margin * 2));
      doc.text(splitAnalysis, margin, yPos);
      yPos += (splitAnalysis.length * 5) + 15;
      if (record.smartGoals && record.smartGoals.length > 0) {
          if (yPos > 240) { doc.addPage(); yPos = 20; }
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text("Metas SMART Prioritárias", margin, yPos);
          yPos += 10;
          record.smartGoals.forEach(sg => {
              if (yPos > 270) { doc.addPage(); yPos = 20; }
              doc.setFontSize(11);
              doc.setTextColor(79, 70, 229);
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
      doc.save(`roda-da-vida-${record.formattedDate.replace(/\//g, '-').replace(/:/g, '-')}.pdf`);
  };

  const getInputStyles = (val: number) => {
    if (val <= 3) return 'border-red-200 text-red-600 focus:ring-red-200 bg-red-50';
    if (val <= 6) return 'border-yellow-200 text-yellow-600 focus:ring-yellow-200 bg-yellow-50';
    if (val <= 8) return 'border-blue-200 text-blue-600 focus:ring-blue-200 bg-blue-50';
    return 'border-emerald-200 text-emerald-600 focus:ring-emerald-200 bg-emerald-50';
  };

  const getGradient = (val: number) => {
      const percentage = (val / 10) * 100;
      let color = '#ef4444'; // Red-500
      if (val > 3) color = '#eab308'; // Yellow-500
      if (val > 6) color = '#3b82f6'; // Blue-500
      if (val > 8) color = '#10b981'; // Emerald-500
      return `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
  };

  const getEmojiForScore = (val: number) => {
      if (val <= 3) return "😟";
      if (val <= 6) return "😐";
      if (val <= 8) return "🙂";
      return "🤩";
  }
  
  // TOUR STEPS CONFIGURATION
  const tourSteps: TourStep[] = [
    {
      targetId: 'center',
      title: 'Bem-vindo(a) à sua Roda da Vida!',
      content: 'Esta é uma ferramenta de autoconhecimento poderosa. Vamos fazer um tour rápido para você aproveitar ao máximo?'
    },
    {
      targetId: 'tour-custom-btn',
      title: 'Personalize sua Jornada',
      content: 'Você pode usar o modelo padrão de áreas ou criar sua própria roda 100% personalizada clicando aqui.',
      position: 'bottom'
    },
    {
      targetId: 'tour-sliders',
      title: 'Avalie cada Área',
      content: 'Use os sliders para dar uma nota de 0 a 10 para cada área da sua vida. Seja sincero com você mesmo!',
      position: 'top'
    },
    {
      targetId: 'tour-chart',
      title: 'Visualize o Equilíbrio',
      content: 'Seu gráfico será atualizado em tempo real. Uma roda "quebrada" não gira bem. Busque o equilíbrio, não a perfeição.',
      position: 'right'
    },
    {
      targetId: 'tour-cta-btn',
      title: 'IA Coach "Fala na Lata"',
      content: 'Quando terminar, clique aqui. Nossa Inteligência Artificial vai analisar seus padrões e te dar um plano de ação prático.',
      position: 'top'
    }
  ];

  if (!loaded) return null;

  return (
    <div className="min-h-screen text-slate-800 pb-24 font-sans relative">
      {/* VISUAL EFFECTS LAYERS */}
      <InteractiveBackground />
      <SpotlightEffect />
      
      {/* TOUR */}
      <OnboardingTour 
        isOpen={showTour} 
        steps={tourSteps} 
        onComplete={handleTourComplete} 
        onSkip={handleTourComplete} 
      />

      {/* COMPACT & MINIMALIST HEADER */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Minha Roda da Vida" 
              className="h-9 w-auto object-contain drop-shadow-sm" 
            />
            <h1 className="hidden sm:block text-lg font-bold text-slate-800 tracking-tight">Roda da Vida</h1>
          </div>
          
          {/* Controls Section */}
          <div className="flex items-center gap-3">
            {isPremium && (
                <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100 shadow-sm">
                    <Star className="w-3 h-3 fill-yellow-500" />
                    <span className="text-[10px] font-bold tracking-wide">PRO</span>
                </div>
            )}

            <button 
                id="tour-custom-btn"
                onClick={handleModeToggle}
                className={`
                   flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm
                   ${mode === 'custom' 
                     ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200' 
                     : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-emerald-200'}
                `}
            >
                {mode === 'custom' ? <RotateCcw className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{mode === 'custom' ? 'Voltar para Padrão' : 'Modo Customizado'}</span>
                <span className="sm:hidden">{mode === 'custom' ? 'Padrão' : 'Custom'}</span>
            </button>
          </div>
        </div>
      </header>

      <main 
        className={`max-w-5xl mx-auto px-4 py-8 space-y-8 relative z-10 transition-all duration-600 ease-luxury ${
          isTransitioning ? 'opacity-0 translate-y-8 blur-md' : 'opacity-100 translate-y-0 blur-0'
        }`}
      >
        
        {/* CUSTOM WHEEL SETUP WIZARD */}
        {mode === 'custom' && isSettingUpCustom && (
            <TiltCard className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
                {/* ... setup form content (unchanged) ... */}
                <div className="mb-6 text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                        <LayoutGrid className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Crie sua Roda Personalizada</h2>
                    <p className="text-slate-500 mt-2">Defina as áreas que são importantes para você agora.</p>
                </div>

                {customStep === 1 ? (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Quantas áreas você deseja?</label>
                            <input 
                                type="number" 
                                min="4" 
                                max="20" 
                                value={customAreaCount}
                                onChange={(e) => setCustomAreaCount(parseInt(e.target.value))}
                                className="w-full text-center text-4xl font-bold p-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all bg-white/50"
                            />
                        </div>
                        <button 
                            onClick={handleStartCustomSetup}
                            disabled={customAreaCount < 4 || customAreaCount > 20}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continuar
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                            {customAreaNames.map((name, idx) => (
                                <div key={idx}>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Área {idx + 1}</label>
                                    <input 
                                        type="text"
                                        value={name}
                                        onChange={(e) => updateCustomName(idx, e.target.value)}
                                        placeholder={`Nome da área ${idx + 1}`}
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 outline-none transition-all bg-white/50"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setCustomStep(1)}
                                className="px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Voltar
                            </button>
                            <button 
                                onClick={handleFinishCustomSetup}
                                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all"
                            >
                                Gerar Minha Roda Personalizada
                            </button>
                        </div>
                    </div>
                )}
            </TiltCard>
        )}

        {/* MAIN APP CONTENT (Hidden during setup) */}
        {(!isSettingUpCustom || mode === 'standard') && (
            <>
                {/* Edit Custom Button (Small utility) */}
                {mode === 'custom' && !isSettingUpCustom && (
                    <div className="flex justify-end">
                        <button 
                            onClick={() => setIsSettingUpCustom(true)}
                            className="text-xs flex items-center gap-1 text-slate-400 hover:text-emerald-600 transition-colors bg-white/50 px-3 py-1 rounded-full"
                        >
                            <Settings className="w-3 h-3" />
                            Editar áreas
                        </button>
                    </div>
                )}

                {/* Top Section: Chart & Sliders */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Chart Card */}
                <div id="tour-chart" className="contents">
                    <TiltCard ref={chartRef} className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100 flex flex-col justify-center sticky lg:top-24 z-20">
                        <div className="w-full mb-4 flex justify-between items-center px-2">
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Visão Geral {mode === 'custom' ? '(Custom)' : ''}</h2>
                            <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-500 font-medium">Hoje</span>
                        </div>
                        {/* Pass Active Categories to Chart */}
                        <WheelChart scores={activeScores} categories={activeCategories} />
                        <p className="text-center text-xs text-slate-400 mt-4 max-w-xs font-medium mx-auto">
                            Quanto mais ampla e redonda, mais fluida é sua jornada.
                        </p>
                    </TiltCard>
                </div>

                {/* Sliders Grid */}
                <div id="tour-sliders" className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Avalie suas Áreas</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4">
                    {activeCategories.map((category) => (
                        <div 
                          key={category} 
                          className="group bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                             <div className="text-2xl">{getEmojiForScore(activeScores[category])}</div>
                          </div>

                          <div className="flex justify-between items-center mb-4 gap-2">
                              <label className="text-sm font-bold text-slate-700 truncate flex-1" title={category}>
                              {category.includes('&') ? (
                                  <>
                                      {category.split('&')[0]} <span className="text-slate-400 font-normal">& {category.split('&')[1]}</span>
                                  </>
                              ) : category}
                              </label>
                              <input
                              type="number"
                              min="0"
                              max="10"
                              value={activeScores[category]}
                              onChange={(e) => handleScoreChange(category, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className={`w-12 h-10 text-center font-bold text-lg rounded-lg border-2 focus:ring-4 transition-all outline-none ${getInputStyles(activeScores[category])}`}
                              />
                          </div>
                          
                          <div className="relative w-full h-6 flex items-center">
                              <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  step="1"
                                  value={activeScores[category]}
                                  onChange={(e) => handleScoreChange(category, e.target.value)}
                                  style={{ background: getGradient(activeScores[category]) }}
                                  className="w-full appearance-none focus:outline-none bg-transparent h-2 rounded-full cursor-pointer"
                              />
                          </div>
                        </div>
                    ))}
                    </div>
                </div>
                </div>

                {/* Notes Section */}
                <TiltCard className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100 relative group">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                              <RefreshCw className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                              <h2 className="text-lg font-bold text-slate-800">Notas do Momento</h2>
                              <p className="text-xs text-slate-500">O que te impede de dar nota 10?</p>
                          </div>
                      </div>
                      <div className="text-xs font-medium text-slate-400 flex items-center gap-1">
                          {isSaving ? (
                              <span className="flex items-center gap-1 text-indigo-500 animate-pulse"><RefreshCw className="w-3 h-3 animate-spin" /> Salvando...</span>
                          ) : (
                              <span className="flex items-center gap-1 text-emerald-600 transition-opacity duration-500"><CheckCircle2 className="w-3 h-3" /> Salvo</span>
                          )}
                      </div>
                  </div>
                  <textarea
                      value={activeNotes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Desabafe aqui... Como você está se sentindo? O que aconteceu para você dar essas notas?"
                      className="w-full h-40 p-4 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-y text-slate-700 placeholder:text-slate-400"
                  />
                  <div className="flex justify-end mt-2">
                     <span className="text-xs text-slate-400 font-medium">{activeNotes.length} caracteres</span>
                  </div>
                </TiltCard>

                {/* History Section (Unchanged logic, just layout) */}
                {history.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <History className="w-5 h-5 text-slate-400" />
                            <h2 className="text-xl font-bold text-slate-800">Histórico de Evolução</h2>
                        </div>
                         {/* ... Existing History Rendering ... */}
                        <div className="space-y-3">
                            {history.map((record) => (
                                <div key={record.id} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl overflow-hidden transition-all hover:shadow-md">
                                    <div 
                                        onClick={() => setExpandedHistoryId(expandedHistoryId === record.id ? null : record.id)}
                                        className="p-4 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-white/50 transition-colors"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                            <span className="font-bold text-slate-700 text-sm sm:text-base">{record.formattedDate}</span>
                                            <div className="flex gap-2">
                                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-semibold">
                                                    Média: {record.averageScore}
                                                </span>
                                                {record.mode === 'custom' && (
                                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-semibold">
                                                        Custom
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-400">
                                            {expandedHistoryId === record.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </div>
                                    
                                    {expandedHistoryId === record.id && (
                                        <div className="p-4 border-t border-slate-100 bg-white/50 animate-in slide-in-from-top-2">
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
                                                    disabled={!isPremium}
                                                    className={`text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                                                        !isPremium 
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                                                    }`}
                                                >
                                                    {isPremium ? <Download className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
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
            </>
        )}
      </main>

      {/* Floating Action Button (CTA) */}
      {(!isSettingUpCustom || mode === 'standard') && (
        <div 
          id="tour-cta-btn"
          className={`fixed bottom-8 left-0 right-0 flex justify-center px-4 z-40 pointer-events-none transition-all duration-500 ease-luxury ${
             isTransitioning ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'
          }`}
        >
            <button
            onClick={handleAnalyzeClick}
            className="pointer-events-auto shadow-2xl shadow-indigo-500/40 bg-slate-900 hover:bg-slate-800 text-white pl-6 pr-8 py-4 rounded-full flex items-center gap-4 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 group border-2 border-slate-700/50 hover:border-indigo-500/50 relative overflow-hidden"
            >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
            
            <div className="relative p-2 bg-white/10 rounded-full group-hover:bg-yellow-400/20 transition-colors">
                <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />
            </div>
            <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-0.5">IA ATIVADA</span>
                <span className="font-bold text-xl leading-none tracking-tight">FALA NA LATA</span>
            </div>
            </button>
        </div>
      )}

      {/* MODALS */}
      <EmailCaptureModal 
        isOpen={showEmailModal} 
        onClose={() => setShowEmailModal(false)}
        onSuccess={handleEmailSuccess}
      />

      <AnalysisModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scores={activeScores}
        notes={activeNotes}
        categories={activeCategories}
        onAnalysisComplete={saveAnalysisToHistory}
        onExportPDF={generatePDF}
        onUpdateRecord={updateHistoryRecord}
        isPremium={isPremium}
        onTriggerPremium={handleTriggerPremium}
      />

      <CheckoutModal 
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={handlePaymentSuccess}
        price="R$ 7,99"
      />
    </div>
  );
};

export default App;
