
export type Category = 
  | 'Saúde & Energia'
  | 'Carreira & Propósito'
  | 'Finanças & Segurança'
  | 'Relacionamento Amoroso'
  | 'Família & Amigos'
  | 'Crescimento & Espiritualidade'
  | 'Lazer & Diversão'
  | 'Contribuição & Legado';

export const CATEGORIES: string[] = [
  'Saúde & Energia',
  'Carreira & Propósito',
  'Finanças & Segurança',
  'Relacionamento Amoroso',
  'Família & Amigos',
  'Crescimento & Espiritualidade',
  'Lazer & Diversão',
  'Contribuição & Legado'
];

export interface WheelData {
  scores: Record<string, number>;
  notes: string;
  lastUpdated: string;
}

export interface CustomWheelData {
  categories: string[];
  scores: Record<string, number>;
  notes: string;
  lastUpdated: string;
}

export interface AnalysisRecord {
  id: string;
  timestamp: string; // ISO string for sorting
  formattedDate: string; // "09/12/2025 às 14:37"
  scores: Record<string, number>;
  userNotes: string;
  aiResponse: string;
  averageScore: number;
  smartGoals?: SmartGoal[];
  mode?: 'standard' | 'custom'; // To track which wheel type was analyzed
  categories?: string[]; // To store the labels used at that time
}

export interface SmartGoal {
  area: string;
  goal: string;
}

export const INITIAL_SCORES: Record<string, number> = {
  'Saúde & Energia': 5,
  'Carreira & Propósito': 5,
  'Finanças & Segurança': 5,
  'Relacionamento Amoroso': 5,
  'Família & Amigos': 5,
  'Crescimento & Espiritualidade': 5,
  'Lazer & Diversão': 5,
  'Contribuição & Legado': 5,
};
