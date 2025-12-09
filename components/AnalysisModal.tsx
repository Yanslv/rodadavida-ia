
import React, { useState } from 'react';
import { CATEGORIES, AnalysisRecord, SmartGoal } from '../types';
import { analyzeWheelOfLife, generateSmartGoals } from '../services/geminiService';
import { Loader2, Copy, Check, Sparkles, X, Download, Target, ArrowRight } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores: Record<string, number>;
  notes: string;
  onAnalysisComplete: (result: string) => AnalysisRecord; // Callback to parent to save history
  onExportPDF: (record: AnalysisRecord) => void;
  onUpdateRecord: (id: string, updates: Partial<AnalysisRecord>) => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ 
  isOpen, 
  onClose, 
  scores, 
  notes, 
  onAnalysisComplete,
  onExportPDF,
  onUpdateRecord
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [currentRecord, setCurrentRecord] = useState<AnalysisRecord | null>(null);
  const [copied, setCopied] = useState(false);
  
  // SMART Goals State
  const [isGeneratingSmart, setIsGeneratingSmart] = useState(false);
  const [smartGoals, setSmartGoals] = useState<SmartGoal[] | null>(null);
  const [copiedGoalIndex, setCopiedGoalIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const generatePrompt = () => {
    let scoreText = '';
    CATEGORIES.forEach(cat => {
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
      
      // Save goals to history
      if (currentRecord) {
        onUpdateRecord(currentRecord.id, { smartGoals: goals });
        // Update local record state so PDF export catches it immediately
        setCurrentRecord(prev => prev ? ({ ...prev, smartGoals: goals }) : null);
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao gerar metas. Tente novamente.");
    } finally {
      setIsGeneratingSmart(false);
    }
  };

  // Convert markdown-style response to simple paragraphs for safe rendering
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        
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
            <div className="space-y-6">
              <div className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">Análise da IA:</h3>
                <div className="prose prose-indigo max-w-none text-sm sm:text-base">
                  {renderAnalysis(analysisResult)}
                </div>
              </div>

              {/* SMART Goals Section */}
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
                      <span className="font-bold text-lg">Gerar minhas Metas SMART agora</span>
                      <ArrowRight className="w-5 h-5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-slate-400" />
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-800">Suas Metas SMART Prioritárias</h3>
                  </div>
                  
                  <div className="grid gap-4">
                    {smartGoals.map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                         <div className="flex justify-between items-start mb-2">
                            <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded uppercase tracking-wider">
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
                         <p className="text-slate-700 font-medium leading-relaxed">
                           {item.goal}
                         </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Footer Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                 <button 
                  onClick={() => currentRecord && onExportPDF(currentRecord)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar PDF
                </button>
                 <button 
                  onClick={() => {
                      setAnalysisResult(null);
                      setCurrentRecord(null);
                      setSmartGoals(null);
                  }}
                  className="text-indigo-600 px-4 py-2 text-sm font-medium hover:underline"
                >
                  Refazer Análise
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-600 leading-relaxed">
                Aqui está o prompt gerado com base nos seus dados atuais. Você pode copiar para usar no seu assistente de IA preferido (ChatGPT, Claude, Grok) ou pedir uma análise rápida aqui mesmo.
              </p>

              <div className="relative group">
                <textarea 
                  readOnly
                  value={promptText}
                  className="w-full h-48 p-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-600 focus:outline-none resize-none"
                />
                <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    <span className="text-xs font-medium text-slate-700">{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions (Only shown before analysis) */}
        {!analysisResult && (
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3">
            <button
                onClick={handleCopy}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
                Copiar Prompt
            </button>
            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
            >
                {isAnalyzing ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analisando...
                </>
                ) : (
                <>
                    <Sparkles className="w-5 h-5" />
                    Analisar Agora (IA)
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
