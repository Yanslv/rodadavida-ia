
import React, { useState } from 'react';
import { AnalysisRecord, SmartGoal } from '../types';
import { analyzeWheelOfLife, generateSmartGoals } from '../services/geminiService';
import { Loader2, Copy, Check, Sparkles, X, Download, Target, ArrowRight, Lock } from 'lucide-react';
import PremiumUpsell from './PremiumUpsell';
import { useMountTransition } from './VisualEffects';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores: Record<string, number>;
  notes: string;
  categories: string[];
  onAnalysisComplete: (result: string) => AnalysisRecord; 
  onExportPDF: (record: AnalysisRecord) => void;
  onUpdateRecord: (id: string, updates: Partial<AnalysisRecord>) => void;
  isPremium: boolean;
  onTriggerPremium: () => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ 
  isOpen, 
  onClose, 
  scores, 
  notes,
  categories,
  onAnalysisComplete,
  onExportPDF,
  onUpdateRecord,
  isPremium,
  onTriggerPremium
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [currentRecord, setCurrentRecord] = useState<AnalysisRecord | null>(null);
  const [copied, setCopied] = useState(false);
  
  // SMART Goals State
  const [isGeneratingSmart, setIsGeneratingSmart] = useState(false);
  const [smartGoals, setSmartGoals] = useState<SmartGoal[] | null>(null);
  const [copiedGoalIndex, setCopiedGoalIndex] = useState<number | null>(null);

  // Animation Hook (400ms match the tailwind transition duration)
  const { shouldRender, transitionClasses } = useMountTransition(isOpen, 400);

  if (!shouldRender) return null;

  const generatePrompt = () => {
    let scoreText = '';
    categories.forEach(cat => {
      scoreText += `${cat}: ${scores[cat]}/10\n`;
    });

    return `Analisa minha roda da vida atual com muita sinceridade e brutalidade carinhosa. Aqui estão minhas notas de hoje:

${scoreText}

Notas do momento: ${notes || "Sem notas adicionais."}

Me diz:
- Qual o maior desequilíbrio atual
- As 1-2 áreas que estão sabotando tudo
- Plano de 30 dias com no máximo 3 ações concretas e mínimas
- Uma frase dura se eu estiver me sabotando`;
  };

  const promptText = generatePrompt();

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyGoal = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedGoalIndex(index);
    setTimeout(() => setCopiedGoalIndex(null), 2000);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Reset previous smart goals if any
    setSmartGoals(null); 
    try {
      const result = await analyzeWheelOfLife(promptText);
      setAnalysisResult(result);
      // Automatically save to history via parent callback
      const newRecord = onAnalysisComplete(result);
      setCurrentRecord(newRecord);
    } catch (error) {
      setAnalysisResult("Ocorreu um erro ao conectar com a IA. Por favor, copie o prompt e use no ChatGPT ou Claude.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSmartGoals = async () => {
    setIsGeneratingSmart(true);
    try {
      const goals = await generateSmartGoals(scores, notes);
      setSmartGoals(goals);
      
      if (currentRecord) {
        onUpdateRecord(currentRecord.id, { smartGoals: goals });
        setCurrentRecord(prev => prev ? ({ ...prev, smartGoals: goals }) : null);
      }
    } catch (error) {
      console.error("Erro ao gerar metas SMART:", error);
    } finally {
      setIsGeneratingSmart(false);
    }
  };

  const renderAnalysis = (text: string) => {
    return text.split('\n').map((line, idx) => {
        if (line.startsWith('- ') || line.startsWith('* ')) {
             return <li key={idx} className="ml-4 mb-2 text-slate-700">{line.replace(/^[-*] /, '')}</li>;
        }
        if (line.trim().length === 0) return <br key={idx} />;
        if (line.startsWith('##') || line.startsWith('**')) {
             return <p key={idx} className="font-bold text-slate-900 mt-4 mb-2">{line.replace(/[#*]/g, '')}</p>;
        }
        return <p key={idx} className="mb-2 text-slate-700 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-400 ease-luxury ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col transform transition-all duration-400 ease-luxury ${transitionClasses}`}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
               <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Fala na Lata</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Result Area */}
          {analysisResult ? (
            <div className="space-y-6 animate-fade-in">
              
              {/* Basic Analysis (Always Free) */}
              <div className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">Análise Resumida da IA:</h3>
                <div className="prose prose-indigo max-w-none text-sm sm:text-base">
                  {renderAnalysis(analysisResult)}
                </div>
              </div>

              {/* PREMIUM UPSELL BLOCK */}
              {!isPremium && <PremiumUpsell onUpgrade={onTriggerPremium} />}

              {/* SMART Goals Section */}
              {isPremium && (
                <>
                {!smartGoals ? (
                    <button
                    onClick={handleSmartGoals}
                    disabled={isGeneratingSmart}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group"
                    >
                    {isGeneratingSmart ? (
                        <>
                        <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
                        <span className="font-semibold">Criando estratégia...</span>
                        </>
                    ) : (
                        <>
                        <Target className="w-6 h-6 text-yellow-400" />
                        <span className="font-bold text-lg">Gerar Metas SMART (Todas as Áreas)</span>
                        <ArrowRight className="w-5 h-5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-slate-400" />
                        </>
                    )}
                    </button>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-bold text-slate-800">Suas Metas SMART (Plano de Ação)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {smartGoals.map((item, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group h-full flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider truncate max-w-[85%]">
                                {item.area}
                                </span>
                                <button 
                                onClick={() => handleCopyGoal(item.goal, idx)}
                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                                title="Copiar meta"
                                >
                                {copiedGoalIndex === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-slate-700 font-medium leading-relaxed text-sm flex-1">
                            {item.goal}
                            </p>
                        </div>
                        ))}
                    </div>
                    </div>
                )}
                </>
              )}
              
              {/* Footer Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                 <button 
                  onClick={() => {
                      if (isPremium) {
                        currentRecord && onExportPDF(currentRecord)
                      } else {
                        onTriggerPremium()
                      }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                      isPremium 
                      ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                  }`}
                >
                  {isPremium ? (
                      <>
                        <Download className="w-4 h-4" />
                        Exportar PDF
                      </>
                  ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Baixar Relatório Completo (PDF)
                      </>
                  )}
                </button>
                 <button 
                  onClick={() => {
                      setAnalysisResult(null);
                      setCurrentRecord(null);
                      setSmartGoals(null);
                  }}
                  className="text-slate-500 px-4 py-2 text-sm font-medium hover:underline hover:text-indigo-600"
                >
                  Refazer
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-600 leading-relaxed">
                Nossa IA vai analisar seus padrões de sabotagem e identificar onde você precisa focar sua energia agora.
              </p>
              
              {!isPremium && (
                 <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-xs text-yellow-800 flex gap-2">
                     <Sparkles className="w-4 h-4 flex-shrink-0" />
                     <span>Obtenha a análise gratuita agora. O plano detalhado pode ser desbloqueado depois.</span>
                 </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions (Only shown before analysis) */}
        {!analysisResult && (
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3">
            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shadow-slate-200 flex items-center justify-center gap-2"
            >
                {isAnalyzing ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando Análise...
                </>
                ) : (
                <>
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Gerar Minha Análise
                </>
                )}
            </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisModal;
