export type Category = 
  | 'Saúde & Energia'
  | 'Carreira & Propósito'
  | 'Finanças & Segurança'
  | 'Relacionamento Amoroso'
  | 'Família & Amigos'
  | 'Crescimento & Espiritualidade'
  | 'Lazer & Diversão'
  | 'Contribuição & Legado';

export const CATEGORIES: Category[] = [
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
  scores: Record<Category, number>;
  notes: string;
  lastUpdated: string;
}

export interface AnalysisRecord {
  id: string;
  timestamp: string; // ISO string for sorting
  formattedDate: string; // "09/12/2025 às 14:37"
  scores: Record<Category, number>;
  userNotes: string;
  aiResponse: string;
  averageScore: number;
}

export const INITIAL_SCORES: Record<Category, number> = {
  'Saúde & Energia': 5,
  'Carreira & Propósito': 5,
  'Finanças & Segurança': 5,
  'Relacionamento Amoroso': 5,
  'Família & Amigos': 5,
  'Crescimento & Espiritualidade': 5,
  'Lazer & Diversão': 5,
  'Contribuição & Legado': 5,
};