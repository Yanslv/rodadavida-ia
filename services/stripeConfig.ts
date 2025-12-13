import { loadStripe } from '@stripe/stripe-js';

// Tenta obter do .env, senão usa o fallback
const getStripeKey = () => {
  // @ts-ignore
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ) {
    // @ts-ignore
    return import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  }
  return 'pk_test_51SdcmOJtfHOA6eOhKEIs000pUtbP5hwnkRNVUV23jDEETctmLeLTcZowzT2rgxobDKAFGzhsMq8h2C63esSU55Zh00BrWwb21l';
};

const STRIPE_PUBLIC_KEY = getStripeKey();

export const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
