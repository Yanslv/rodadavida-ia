
import React, { useState } from 'react';
import { AnalysisRecord, SmartGoal } from '../types';
import { analyzeWheelOfLife, generateSmartGoals } from '../services/geminiService';
import { Loader2, Copy, Check, Sparkles, X, Download, Target, ArrowRight, Lock, Share2, MessageCircle, Smartphone } from 'lucide-react';
import PremiumUpsell from './PremiumUpsell';
import { useMountTransition } from './VisualEffects';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  // SMART Goals State
  const [isGeneratingSmart, setIsGeneratingSmart] = useState(false);
  const [smartGoals, setSmartGoals] = useState<SmartGoal[] | null>(null);
  const [copiedGoalIndex, setCopiedGoalIndex] = useState<number | null>(null);

  // Social Share State
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedShareIndex, setCopiedShareIndex] = useState<number | null>(null);

  // Animation Hook (400ms match the tailwind transition duration)
  const { shouldRender, transitionClasses } = useMountTransition(isOpen, 400);

  if (!shouldRender) return null;

  const shareOptions = [
    {
      type: 'funny',
      label: '🤡 Rir pra não chorar',
      color: 'bg-pink-50 border-pink-200 text-pink-700',
      text: "Minha vida não tá girando, tá capotando. 🤡 Mas pelo menos o gráfico ficou bonito.\n\nDescobre o tamanho do teu tombo aqui 😂👇\nAcesse sua Roda da Vida: google.com.br"
    },
    {
      type: 'hard',
      label: '🔥 Tapa na cara',
      color: 'bg-slate-50 border-slate-200 text-slate-800',
      text: "A mentira que a gente conta pra si mesmo acaba quando o gráfico aparece. A realidade bateu e doeu. 👊\n\nTem coragem de ver a verdade? 👇\nAcesse sua Roda da Vida: google.com.br"
    },
    {
      type: 'motivational',
      label: '✨ Clareza Total',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      text: "Parei de chutar o que estava errado. Agora eu tenho um mapa e sei exatamente onde focar. Clareza é poder. 🗺️\n\nFaz tua análise gratuita também 👇\nAcesse sua Roda da Vida: google.com.br"
    }
  ];

  const generatePrompt = () => {
    let scoreText = '';
    categories.forEach(cat => {
      scoreText += `${cat}: ${scores[cat]}/10\n`;
    });

    return `
      Gere um RELATÓRIO DE VIDA COMPLETO baseado na Roda da Vida abaixo.
      O relatório deve ser altamente útil, prático e tão bem estruturado que a pessoa queira exportar para PDF e colar na parede.

      DADOS DO USUÁRIO:
      ${scoreText}
      Notas do usuário: ${notes || "Nenhuma nota fornecida."}

      INSTRUÇÕES DE ESTRUTURA (Use Markdown para formatar):

      ## 1. INTRODUÇÃO: A VERDADE NUA E CRUA
      - Explique o estado geral da vida (ex: estagnação, caos, ou potencial desperdiçado).
      - Seja sincero e direto. Sem frases motivacionais vazias.

      ## 2. ANÁLISE PROVOCATIVA
      - Identifique os padrões de sabotagem.
      - Mostre o que está travando o usuário de verdade.

      ## 3. PLANO DE BATALHA (90 DIAS)
      Crie uma lista estruturada contendo:
      - 3 Hábitos Diários inegociáveis.
      - 2 Hábitos Semanais para manutenção.
      - Sinais de progresso (como saber que está funcionando).
      - O que fazer quando o desânimo bater (protocolo de emergência).

      ## 4. CHECKLIST MENSAL (PARA IMPRESSÃO)
      - Crie 4-5 itens de verificação simples para o usuário marcar no fim do mês.

      ## 5. RESUMO VISUAL DE 1 PÁGINA
      (Esta seção é crucial. Crie um resumo curto e impactante para servir de wallpaper ou folha de parede)
      - Foco principal do mês.
      - A frase mantra para este momento.
      - As 2 áreas que vão puxar todas as outras.

      ## 6. MENSAGEM FINAL
      - Curta, direta e transformadora.
    `;
  };

  const handleCopyGoal = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedGoalIndex(index);
    setTimeout(() => setCopiedGoalIndex(null), 2000);
  };

  const handleCopyShare = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedShareIndex(index);
    setTimeout(() => setCopiedShareIndex(null), 2000);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Reset previous smart goals if any
    setSmartGoals(null);
    try {
      const promptText = generatePrompt();
      const result = await analyzeWheelOfLife(promptText);
      setAnalysisResult(result);
      // Automatically save to history via parent callback
      const newRecord = onAnalysisComplete(result);
      setCurrentRecord(newRecord);
    } catch (error: any) {
      console.error('Erro ao analisar roda da vida:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      setAnalysisResult(`Ocorreu um erro ao conectar com a IA: ${errorMessage}. Por favor, verifique se a chave da API está configurada corretamente e tente novamente.`);
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
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-xl font-bold text-indigo-900 mt-6 mb-3 border-b border-indigo-100 pb-1">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-lg font-semibold text-slate-800 mt-4 mb-2">{line.replace('### ', '')}</h4>;
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <li key={idx} className="ml-4 mb-2 text-slate-700 list-disc pl-1 marker:text-indigo-500">{line.replace(/^[-*] /, '')}</li>;
      }
      if (line.trim().length === 0) return <br key={idx} />;
      if (line.startsWith('**')) {
        return <p key={idx} className="font-bold text-slate-900 mt-4 mb-2">{line.replace(/\*\*/g, '')}</p>;
      }
      return <p key={idx} className="mb-2 text-slate-700 leading-relaxed">{line.replace(/\*\*/g, '')}</p>;
    });
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-400 ease-luxury ${isOpen ? 'opacity-100' : 'opacity-0'
        }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col transform transition-all duration-400 ease-luxury ${transitionClasses}`}
      >

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Seu Relatório de Vida</h2>
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

              {/* Share Menu Overlay */}
              {showShareMenu && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 animate-in slide-in-from-top-4 mb-6 relative">
                  <button
                    onClick={() => setShowShareMenu(false)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    Escolha seu Status do WhatsApp
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {shareOptions.map((opt, idx) => (
                      <div key={idx} className={`rounded-xl p-4 border flex flex-col ${opt.color} hover:shadow-md transition-all`}>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">{opt.label}</span>
                        <p className="text-sm font-medium whitespace-pre-line flex-1 mb-4 leading-relaxed">
                          {opt.text}
                        </p>
                        <button
                          onClick={() => handleCopyShare(opt.text, idx)}
                          className="w-full py-2 bg-white/50 hover:bg-white text-current rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-current/10"
                        >
                          {copiedShareIndex === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedShareIndex === idx ? 'Copiado!' : 'Copiar Texto'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Analysis Report */}
              <div className="bg-white rounded-xl p-6 sm:p-8 border border-indigo-100 shadow-sm">
                <div className="prose prose-indigo max-w-none text-sm sm:text-base">
                  {renderAnalysis(analysisResult)}
                </div>
              </div>

              {/* PREMIUM UPSELL BLOCK */}
              {!isPremium && <PremiumUpsell onUpgrade={onTriggerPremium} />}

              {/* SMART Goals Section (Premium) */}
              {isPremium && (
                <>
                  {!smartGoals ? (
                    <button
                      onClick={handleSmartGoals}
                      disabled={isGeneratingSmart}
                      className="w-full py-5 bg-slate-900 text-white rounded-xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group border border-slate-700"
                    >
                      {isGeneratingSmart ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
                          <span className="font-semibold">Gerando Plano de Ação...</span>
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
                      <div className="flex items-center gap-2 mb-2 mt-8 border-t border-slate-100 pt-6">
                        <Target className="w-6 h-6 text-indigo-600" />
                        <h3 className="text-xl font-bold text-slate-800">Suas Metas SMART (Micro-Hábitos)</h3>
                      </div>
                      <p className="text-slate-500 text-sm mb-4">
                        Foco: Mover de X para X+1 em 30 dias. Ações mínimas, consistência máxima.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {smartGoals.map((item, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group h-full flex flex-col hover:bg-white hover:border-indigo-200">
                            <div className="flex justify-between items-start mb-2">
                              <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider truncate max-w-[85%]">
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
                            <p className="text-slate-800 font-semibold leading-relaxed text-sm flex-1">
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
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100 mt-6">
                {/* Share Button (New) */}
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-200 rounded-xl font-bold transition-all sm:w-auto w-full"
                >
                  <MessageCircle className="w-5 h-5" />
                  Gerar Status WhatsApp
                </button>

                <button
                  onClick={() => {
                    if (isPremium) {
                      currentRecord && onExportPDF(currentRecord)
                    } else {
                      onTriggerPremium()
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isPremium
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
                    }`}
                >
                  {isPremium ? (
                    <>
                      <Download className="w-5 h-5" />
                      Baixar PDF
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Baixar PDF
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setAnalysisResult(null);
                    setCurrentRecord(null);
                    setSmartGoals(null);
                    setShowShareMenu(false);
                  }}
                  className="text-slate-500 px-6 py-3 text-sm font-medium hover:bg-slate-50 rounded-xl transition-colors sm:w-auto w-full"
                >
                  Refazer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Pronto para a verdade?</h3>
              <p className="text-slate-600 leading-relaxed max-w-md mx-auto mb-8">
                Nossa IA vai gerar um relatório "fala na lata", com um plano de 90 dias, checklist e metas que você não vai conseguir ignorar.
              </p>

              {!isPremium && (
                <div className="w-full max-w-md bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-800 flex gap-3 text-left mb-6">
                  <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Nota:</strong> A versão gratuita gera a análise inicial. O relatório PDF completo com Plano de 90 Dias e Metas SMART é exclusivo Premium.
                  </span>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full max-w-md px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold text-lg rounded-xl hover:opacity-90 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Consultando o Oráculo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Gerar Meu Relatório Agora
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
