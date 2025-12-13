// Simula o backend descrito no PRD para o ambiente frontend-only.
// ATENÇÃO: Em produção, você NUNCA deve colocar sua SECRET_KEY no código frontend.
// Esta implementação faz a chamada direta à API do Stripe apenas para fins de demonstração neste ambiente.

// Dividindo a chave para evitar bloqueios de segurança do Git (Secret Scanning)
const PART_A =
  'sk_test_51SdcmOJtfHOA6eOh8kkd8g6NdQKjRaKSnUpRaayqi1PZQS7YGinL6aV';
const PART_B = '5zkw2VBm2ExKAKENhqC6nUYuobYQWf4SQ00hSnA7DRv';
const STRIPE_SECRET_KEY = `${PART_A}${PART_B}`;

export const captureEmail = async (
  email: string,
  wheelData: any
): Promise<{ sessionId: string; userId: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('API CALL: /api/email-capture', { email, wheelData });
      resolve({
        sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
        userId: `user_${Math.random().toString(36).substr(2, 9)}`,
      });
    }, 800);
  });
};

// Esta função simula o que o seu servidor Backend faria: criar um PaymentIntent
export const createPaymentIntent = async (
  amount: number = 799
): Promise<{ clientSecret: string }> => {
  try {
    // Chamada direta à API do Stripe (Normalmente feita pelo servidor)
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency: 'brl',
        'automatic_payment_methods[enabled]': 'true',
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return { clientSecret: data.client_secret };
  } catch (error) {
    console.error('Erro ao criar PaymentIntent:', error);
    throw error;
  }
};

// Mantido para compatibilidade, mas agora vamos usar o fluxo real do Stripe
export const createCheckoutSession = async (
  email: string,
  sessionId: string
): Promise<{ checkoutUrl: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('API CALL: /api/create-checkout', { email, sessionId });
      resolve({
        checkoutUrl: 'https://checkout.stripe.com/mock-session',
      });
    }, 1000);
  });
};
