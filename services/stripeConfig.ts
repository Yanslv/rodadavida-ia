
import { loadStripe } from '@stripe/stripe-js';

// Chave pública fornecida
const STRIPE_PUBLIC_KEY = 'pk_test_51SdcmOJtfHOA6eOhKEIs000pUtbP5hwnkRNVUV23jDEETctmLeLTcZowzT2rgxobDKAFGzhsMq8h2C63esSU55Zh00BrWwb21l';

export const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
