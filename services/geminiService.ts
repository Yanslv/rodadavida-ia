import { GoogleGenAI } from "@google/genai";
import { SmartGoal } from "../types";

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

export const generateSmartGoals = async (scores: Record<string, number>, notes: string): Promise<SmartGoal[]> => {
  try {
    // 1. Identify bottom 3 areas
    const sortedAreas = Object.entries(scores)
      .sort(([, scoreA], [, scoreB]) => scoreA - scoreB)
      .slice(0, 3)
      .map(([area]) => area);

    const prompt = `
      Baseado nestas áreas prioritárias que tiveram as menores notas na Roda da Vida: ${sortedAreas.join(', ')}.
      
      Notas do usuário: ${notes}

      Gere UMA meta SMART (Específica, Mensurável, Alcançável, Relevante, Temporal) para CADA uma dessas 3 áreas.
      
      IMPORTANTE: Retorne APENAS um JSON válido no seguinte formato, sem markdown, sem explicações extras:
      [
        { "area": "Nome da Área 1", "goal": "Texto da meta SMART completa" },
        { "area": "Nome da Área 2", "goal": "Texto da meta SMART completa" },
        { "area": "Nome da Área 3", "goal": "Texto da meta SMART completa" }
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "[]";
    
    // Clean potential markdown code blocks if the model ignores the mimeType
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Erro ao gerar metas SMART:", error);
    throw new Error("Não foi possível gerar as metas agora.");
  }
};