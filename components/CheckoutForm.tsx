
import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Lock, Loader2 } from 'lucide-react';

interface CheckoutFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  price: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSuccess, onCancel, price }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    // Garante que a URL de retorno seja válida para o Stripe
    // Em ambientes sandbox/iframe, window.location.href pode ser estranho (ex: about:srcdoc)
    const currentUrl = window.location.href;
    const isValidUrl = currentUrl.startsWith('http://') || currentUrl.startsWith('https://');
    const returnUrl = isValidUrl ? currentUrl : 'https://minharodadavida.com.br/checkout';

    // O Stripe confirmará o pagamento e pode redirecionar.
    // Como estamos num SPA sem backend real para return_url neste demo,
    // vamos usar o redirect: 'if_required' para tentar capturar o sucesso inline.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: returnUrl, 
      },
    });

    if (error) {
      setErrorMessage(error.message || 'Ocorreu um erro desconhecido.');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
      setIsProcessing(false);
    } else {
       // Caso precise de redirecionamento ou processamento pendente
       setErrorMessage("Pagamento processado. Verifique seu status.");
       onSuccess(); // Assumindo sucesso para o fluxo de demo
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6">
          <h3 className="font-bold text-indigo-900 mb-1">Roda da Vida - Relatório Premium</h3>
          <p className="text-sm text-indigo-700">Acesso vitalício + Plano 90 dias + Metas SMART</p>
          <p className="text-lg font-bold text-indigo-900 mt-2">{price}</p>
      </div>

      <PaymentElement options={{ layout: 'tabs' }} />

      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {errorMessage}
        </div>
      )}

      <button 
        disabled={isProcessing || !stripe || !elements} 
        id="submit"
        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg mt-6 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
           <>
             <Loader2 className="w-4 h-4 animate-spin" />
             Processando...
           </>
        ) : (
           <>
             <Lock className="w-4 h-4" />
             Pagar {price}
           </>
        )}
      </button>
      
      <button 
        type="button" 
        onClick={onCancel} 
        disabled={isProcessing}
        className="w-full py-3 text-slate-500 font-medium hover:text-slate-800 text-sm"
      >
          Cancelar
      </button>
    </form>
  );
};

export default CheckoutForm;
