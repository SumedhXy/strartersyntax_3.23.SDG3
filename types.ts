
export enum TriageLevel {
  CRITICAL = 'CRITICAL', 
  URGENT = 'MODERATE',   // Aligned with engine.py 'MODERATE'
  STABLE = 'STABLE',
  UNKNOWN = 'UNKNOWN'
}

export type Language = 'en' | 'hi' | 'mr';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Vitals {
  age?: number;
  systolic_bp?: number;
  heart_rate?: number;
  spo2?: number;
  temperature?: number;
  consciousness?: 'alert' | 'confused' | 'drowsy' | 'unconscious';
  doctor_assessment?: 'low' | 'moderate' | 'critical';
}

export interface ABCDEStatus {
  A_Airway: string;
  B_Breathing: string;
  C_Circulation: string;
  D_Disability: string;
  E_Exposure: string;
}

export interface TriageResult {
  priority: TriageLevel;
  score: number;
  reasons: string[];
  red_flags_detected: boolean;
  abcde_status: ABCDEStatus;
  narrative_summary: string;
  decision_pathway: string;
}

export interface PatientState {
  symptoms: string[];
  vitals: Vitals;
  triage: TriageResult;
  language: Language;
}

export interface TranslationMap {
  [key: string]: {
    en: string;
    hi: string;
    mr: string;
  };
}
