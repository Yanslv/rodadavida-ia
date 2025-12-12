
import React from 'react';
import { Lock, FileText, CheckCircle2, Star, Clock } from 'lucide-react';

interface PremiumUpsellProps {
  onUpgrade: () => void;
}

const PremiumUpsell: React.FC<PremiumUpsellProps> = ({ onUpgrade }) => {
  return (
    <div className="border border-indigo-100 rounded-2xl overflow-hidden bg-white shadow-xl shadow-indigo-100/50 mt-8 relative group">
      {/* Badge */}
      <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-400 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-sm z-10">
        OFERTA ESPECIAL
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Left: Preview (Blurred) */}
        <div className="md:w-2/5 bg-slate-100 relative min-h-[250px] overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center bg-slate-900/10 backdrop-blur-[2px]">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 animate-bounce">
                    <Lock className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-slate-900 font-bold text-lg drop-shadow-md">Relatório Completo</p>
                <p className="text-slate-800 text-sm font-medium mt-1 mb-4">8 Páginas de Análise Profunda</p>
            </div>
            {/* Fake Content for blur effect */}
            <div className="p-8 opacity-50 filter blur-sm select-none pointer-events-none transform scale-90">
                <div className="h-4 w-3/4 bg-slate-300 mb-4 rounded"></div>
                <div className="h-4 w-full bg-slate-300 mb-2 rounded"></div>
                <div className="h-4 w-5/6 bg-slate-300 mb-2 rounded"></div>
                <div className="h-32 w-full bg-slate-200 my-6 rounded-lg border border-slate-300"></div>
                <div className="h-4 w-full bg-slate-300 mb-2 rounded"></div>
                <div className="h-4 w-4/5 bg-slate-300 mb-2 rounded"></div>
            </div>
        </div>

        {/* Right: Sales Copy */}
        <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-center">
            <div className="mb-4">
                <h3 className="text-2xl font-bold text-slate-800 leading-tight">
                    Desbloqueie seu <span className="text-indigo-600">Plano de Ação Premium</span>
                </h3>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Você já sabe o que está errado. Agora, tenha o mapa exato para consertar. Baixe o PDF completo com análise detalhada e plano de 90 dias.
                </p>
            </div>

            <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Análise profunda das suas <strong>forças e fraquezas</strong></span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>15 Metas SMART</strong> prontas para copiar e colar</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Plano prático de <strong>90 dias</strong> (semana a semana)</span>
                </li>
            </ul>

            <div className="flex items-center justify-between mb-6 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Oferta por tempo limitado</span>
                </div>
                <div className="text-right">
                    <span className="text-slate-400 line-through text-xs font-medium mr-2">R$ 47,00</span>
                    <span className="text-indigo-700 font-bold text-xl">R$ 7,99</span>
                </div>
            </div>

            <button 
                onClick={onUpgrade}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 hover:opacity-95 transition-all flex items-center justify-center gap-2 group transform hover:-translate-y-0.5"
            >
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                Desbloquear Análise Completa
            </button>
            <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Pagamento seguro via Stripe
            </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpsell;
