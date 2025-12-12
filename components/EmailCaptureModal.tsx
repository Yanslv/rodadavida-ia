
import React, { useState } from 'react';
import { Mail, ArrowRight, Lock, Loader2 } from 'lucide-react';
import { useMountTransition } from './VisualEffects';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onSuccess: (email: string) => void;
  onClose: () => void;
}

const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Animation Hook
  const { shouldRender, transitionClasses } = useMountTransition(isOpen, 400);

  if (!shouldRender) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Por favor, insira um email válido.');
      return;
    }
    setError('');
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      onSuccess(email);
    }, 800);
  };

  return (
    <div 
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-400 ease-luxury ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative transform transition-all duration-400 ease-luxury ${transitionClasses}`}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
          <span className="sr-only">Fechar</span>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 120%, white, transparent)' }}></div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md relative z-10">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1 relative z-10">Salve seu Progresso</h2>
          <p className="text-indigo-100 text-sm relative z-10">Para gerar sua análise personalizada, precisamos salvar sua roda.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Seu melhor email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="voce@exemplo.com"
                />
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-70 transform active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Ver Meu Resultado
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <p className="text-xs text-center text-slate-400 mt-4">
              Ao continuar, você concorda em receber sua análise por email. Não enviamos spam.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailCaptureModal;
