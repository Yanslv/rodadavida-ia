
import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, Loader2 } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../services/stripeConfig';
import { createPaymentIntent } from '../services/mockApi';
import CheckoutForm from './CheckoutForm';
import { useMountTransition } from './VisualEffects';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  price: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onSuccess, price }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [step, setStep] = useState<'loading' | 'form' | 'success'>('loading');

  // Animation Hook
  const { shouldRender, transitionClasses } = useMountTransition(isOpen, 400);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('loading');
      setClientSecret(null);

      // Create PaymentIntent on the "server" (mockApi)
      createPaymentIntent(799) // R$ 7,99 em centavos
        .then(data => {
          setClientSecret(data.clientSecret);
          setStep('form');
        })
        .catch(err => {
          console.error(err);
          // Handle initialization error
        });
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleSuccess = () => {
    setStep('success');
    setTimeout(() => {
      onSuccess();
    }, 2500);
  };

  return (
    <div 
      className={`fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm transition-opacity duration-400 ease-luxury ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto transform transition-all duration-400 ease-luxury ${transitionClasses}`}
      >
        
        {step === 'success' ? (
            <div className="p-12 text-center flex flex-col items-center animate-fade-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Pagamento Confirmado!</h2>
                <p className="text-slate-500">Seu relatório premium foi desbloqueado e enviado para seu email.</p>
            </div>
        ) : (
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-slate-700">Checkout Seguro</span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <span className="sr-only">Fechar</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8">
                    {step === 'loading' || !clientSecret ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                            <p className="font-medium text-slate-600">Iniciando pagamento seguro...</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <Elements 
                                stripe={stripePromise} 
                                options={{ 
                                    clientSecret, 
                                    appearance: { 
                                        theme: 'stripe',
                                        variables: {
                                            colorPrimary: '#0f172a',
                                        }
                                    } 
                                }}
                            >
                                <CheckoutForm 
                                    onSuccess={handleSuccess} 
                                    onCancel={onClose} 
                                    price={price}
                                />
                            </Elements>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
