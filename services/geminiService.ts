import { GoogleGenAI } from '@google/genai';
import { SmartGoal } from '../types';

// Helper para obter a chave da API, priorizando variáveis de ambiente do Vite
const getApiKey = (): string => {
  // 1. Tenta ler do .env (Vite)
  // @ts-ignore
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_KEY
  ) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }

  // 2. Fallback para process.env (caso esteja em outro ambiente)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY;
    }
  } catch {}

  // 3. Chave de Fallback (Apenas para demonstração/teste, evite em produção)
  const FALLBACK_KEY_A = 'AIzaSyAUJOeJXnU1p8YAG';
  const FALLBACK_KEY_B = 'ExIQLLVHYLjB3CudWQ';
  return `${FALLBACK_KEY_A}${FALLBACK_KEY_B}`;
};

const API_KEY = getApiKey();

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzeWheelOfLife = async (prompt: string): Promise<string> => {
  try {
    console.log('Tentando chamar Gemini API...', {
      apiKeyPresent: !!API_KEY,
      apiKeyPrefix: API_KEY ? API_KEY.substring(0, 10) : 'não definida',
      model: 'gemini-1.5-flash',
    });

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          "Você é um coach de alta performance, direto, pragmático e 'brutalmente carinhoso'. Seu foco é quebrar a estagnação com planos de ação reais, não frases motivacionais vazias. O usuário deve terminar de ler sentindo que tem um manual de guerra nas mãos.",
        temperature: 0.7,
      },
    });

    return response.text || 'Não foi possível gerar uma análise no momento.';
  } catch (error: any) {
    console.error('Erro ao chamar Gemini:', error);
    const errorMessage =
      error?.message || error?.toString() || 'Erro desconhecido';
    console.error('Detalhes do erro:', {
      message: errorMessage,
      apiKey: API_KEY ? `${API_KEY.substring(0, 10)}...` : 'não definida',
      model: 'gemini-1.5-flash',
    });
    throw new Error(`Falha na conexão com a IA: ${errorMessage}`);
  }
};

export const generateSmartGoals = async (
  scores: Record<string, number>,
  notes: string
): Promise<SmartGoal[]> => {
  try {
    // Preparing data for all areas
    const scoreText = Object.entries(scores)
      .map(([k, v]) => `${k}: ${v}/10`)
      .join('\n');

    const prompt = `
      Atue como um coach especialista em desenvolvimento pessoal com estilo "Fala na Lata".
      
      Sua missão: Gerar metas SMART para TODAS as áreas da Roda da Vida listadas abaixo.
      
      Dados do Usuário:
      ${scoreText}
      
      Notas do usuário: ${notes || 'Nenhuma nota fornecida.'}

      INSTRUÇÕES ESTRITAS:
      1. Tom: Direto, firme, um pouco provocativo. Tire o usuário do piloto automático.
      2. Objetivo da Meta: Mover a nota de X para X+1 em 30 dias (ex: 5/10 para 6/10). Nada de metas heróicas, apenas micro-hábitos impossíveis de ignorar.
      3. Raciocínio (Mental): Use a estrutura S.M.A.R.T (Específico, Mensurável, Alcançável, Relevante, Temporal).
      4. Saída: Apenas a frase final resumida, curta e objetiva.

      Exemplos de Estilo:
      - "Você está no 5/10 porque não se mexe. Caminhe 10 minutos todo dia sem desculpas."
      - "Relação morre sem atenção. Mande uma mensagem genuína toda terça-feira."

      SAÍDA OBRIGATÓRIA (JSON ARRAY):
      [
        { "area": "Nome da Área", "goal": "A meta resumida em uma frase objetiva" },
        ...
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '[]';

    // Clean potential markdown code blocks if the model ignores the mimeType
    const cleanJson = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Erro ao gerar metas SMART:', error);
    throw new Error('Não foi possível gerar as metas agora.');
  }
};
