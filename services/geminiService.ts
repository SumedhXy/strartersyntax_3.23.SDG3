
import { GoogleGenAI, Type } from "@google/genai";
import { TriageLevel, Language, Vitals } from "../types";
import { TriageEngine } from "./triageEngine";

const API_KEY = process.env.API_KEY || '';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  /**
   * Local Parser: Extract vitals using regex for offline scenarios.
   * This ensures the Safety Engine works even without the AI.
   */
  private localExtract(input: string): Vitals {
    const vitals: Vitals = {};
    const lower = input.toLowerCase();

    // Regex for SpO2 (e.g., "spo2 90" or "90%")
    const spo2Match = input.match(/(?:spo2|oxygen|o2)\D*(\d{2,3})/i) || input.match(/(\d{2,3})\s*%/);
    if (spo2Match) vitals.spo2 = parseInt(spo2Match[1]);

    // Regex for BP (e.g., "120/80" or "bp 120")
    const bpMatch = input.match(/(\d{2,3})\/(\d{2,3})/) || input.match(/(?:bp|pressur)\D*(\d{2,3})/i);
    if (bpMatch) vitals.systolic_bp = parseInt(bpMatch[1]);

    // Regex for HR (e.g., "hr 80" or "80 bpm")
    const hrMatch = input.match(/(?:hr|heart|pulse)\D*(\d{2,3})/i) || input.match(/(\d{2,3})\s*bpm/i);
    if (hrMatch) vitals.heart_rate = parseInt(hrMatch[1]);

    // Keywords for consciousness
    if (lower.includes("unconscious") || lower.includes("not waking") || lower.includes("passed out")) {
      vitals.consciousness = 'unconscious';
    } else if (lower.includes("confused") || lower.includes("disoriented")) {
      vitals.consciousness = 'confused';
    } else if (lower.includes("sleepy") || lower.includes("drowsy")) {
      vitals.consciousness = 'drowsy';
    } else {
      vitals.consciousness = 'alert';
    }

    return vitals;
  }

  async processEmergencyChat(input: string, lang: Language): Promise<{
    vitals: Vitals;
    triage: any;
    aiExplanation: string;
    firstAid: string;
    isOffline: boolean;
  }> {
    // Always start by extracting locally as a baseline
    const localVitals = this.localExtract(input);

    try {
      // 1. AI Extraction (Requires Internet)
      const extractResponse = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract clinical vitals from: "${input}". 
        Return JSON. Consciousness: alert, confused, drowsy, unconscious.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              age: { type: Type.NUMBER },
              systolic_bp: { type: Type.NUMBER },
              heart_rate: { type: Type.NUMBER },
              spo2: { type: Type.NUMBER },
              temperature: { type: Type.NUMBER },
              consciousness: { type: Type.STRING },
              doctor_assessment: { type: Type.STRING }
            }
          }
        }
      });

      const aiVitals: Vitals = JSON.parse(extractResponse.text || '{}');
      
      // Merge: AI values take precedence, local values fill gaps
      const finalVitals = { ...localVitals, ...aiVitals };
      
      // 2. RUN DETERMINISTIC ENGINE (LOCAL)
      const triageResult = TriageEngine.calculate(finalVitals);

      // 3. AI Explanation (Requires Internet)
      const explanationResponse = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Patient: ${triageResult.priority}. Reasons: ${triageResult.reasons.join(', ')}. Input: "${input}". 
        Explain calmly in ${lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Marathi'}. 3 first aid tips.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              firstAid: { type: Type.STRING }
            },
            required: ["explanation", "firstAid"]
          }
        }
      });

      const content = JSON.parse(explanationResponse.text || '{}');

      return {
        vitals: finalVitals,
        triage: triageResult,
        aiExplanation: content.explanation,
        firstAid: content.firstAid,
        isOffline: false
      };
    } catch (error) {
      console.warn("Switching to Offline Safety Mode:", error);
      
      // FALLBACK: Use local vitals and local engine only
      const triageResult = TriageEngine.calculate(localVitals);
      
      return {
        vitals: localVitals,
        triage: triageResult,
        aiExplanation: "LOCAL SAFETY ENGINE ACTIVE: Based on the information provided, we have calculated your triage priority locally.",
        firstAid: triageResult.priority === TriageLevel.CRITICAL 
          ? "Apply pressure to wounds. Keep airway clear. Wait for help." 
          : "Stay calm. Monitor breathing and stay in a safe place.",
        isOffline: true
      };
    }
  }
}

export const geminiService = new GeminiService();
