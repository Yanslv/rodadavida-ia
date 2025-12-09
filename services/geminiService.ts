import { GoogleGenAI } from "@google/genai";

// Note: In a production environment, this should be in process.env.API_KEY
// The user provided key is used here for the "Live" functionality as requested.
const API_KEY = process.env.API_KEY || 'AIzaSyAUJOeJXnU1p8YAGExIQLLVHYLjB3CudWQ';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzeWheelOfLife = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Você é um coach de desenvolvimento pessoal experiente, direto e 'brutalmente carinhoso'. Seu objetivo é analisar a Roda da Vida do usuário, identificar padrões de sabotagem e dar conselhos práticos. Não use jargões complexos, fale como uma pessoa real e sábia.",
        temperature: 0.7,
      }
    });

    return response.text || "Não foi possível gerar uma análise no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    throw new Error("Falha na conexão com a IA.");
  }
};