
import { TriageLevel, Vitals, TriageResult, ABCDEStatus } from '../types';

/**
 * Deterministic Triage Decision Engine
 * Directly translated from engine.py for core alignment.
 */
export class TriageEngine {
  
  public static calculate(vitals: Vitals): TriageResult {
    const redFlags = this.checkRedFlags(vitals);
    
    if (redFlags.length > 0) {
      const priority = TriageLevel.CRITICAL;
      return {
        priority,
        score: 10,
        reasons: redFlags,
        red_flags_detected: true,
        abcde_status: this.computeABCDE(vitals),
        narrative_summary: `CRITICAL: ${redFlags[0]}. Immediate emergency response required.`,
        decision_pathway: "RED FLAG DETECTED → CRITICAL (scored 10/10)"
      };
    }

    let score = 0;
    const reasons: string[] = [];

    // Breathing
    if (vitals.spo2 && vitals.spo2 >= 90 && vitals.spo2 < 92) {
      score += 2;
      reasons.push("Oxygen saturation in low-normal range (90-92%)");
    }

    // Circulation
    if (vitals.heart_rate && (vitals.heart_rate < 50 || vitals.heart_rate > 120)) {
      score += 2;
      reasons.push("Heart rate abnormal: below 50 or above 120 bpm");
    }

    if (vitals.systolic_bp) {
      if (vitals.systolic_bp >= 80 && vitals.systolic_bp < 90) {
        score += 2;
        reasons.push("Blood pressure in low-normal range (80-90 mmHg)");
      } else if (vitals.systolic_bp > 180) {
        score += 2;
        reasons.push("Blood pressure elevated above 180 mmHg");
      }
    }

    // Disability
    if (vitals.consciousness === 'drowsy') {
      score += 3;
      reasons.push("Patient is drowsy");
    }

    // Exposure
    if (vitals.temperature && vitals.temperature > 38.0) {
      score += 1;
      reasons.push("Body temperature elevated above 38°C");
    }

    // Age
    if (vitals.age && vitals.age > 60) {
      score += 1;
      reasons.push("Patient age over 60 years");
    }

    // Provider Override
    if (vitals.doctor_assessment === 'moderate') {
      score += 2;
      reasons.push("Provider assessment indicates moderate risk");
    }

    let priority = TriageLevel.STABLE;
    if (score >= 7) priority = TriageLevel.CRITICAL;
    else if (score >= 4) priority = TriageLevel.URGENT;

    return {
      priority,
      score,
      reasons,
      red_flags_detected: false,
      abcde_status: this.computeABCDE(vitals),
      narrative_summary: reasons.length > 0 
        ? `${priority}: ${reasons.join(', ')}.` 
        : `${priority}: All vital signs within normal limits.`,
      decision_pathway: `NO RED FLAGS → SCORE ${score}/10 → ${priority} PRIORITY`
    };
  }

  private static checkRedFlags(vitals: Vitals): string[] {
    const flags: string[] = [];
    if (vitals.spo2 && vitals.spo2 < 90) flags.push("Oxygen saturation critically low (<90%)");
    if (vitals.consciousness === 'unconscious') flags.push("Patient is unconscious");
    if (vitals.systolic_bp && vitals.systolic_bp < 90) flags.push("Blood pressure critically low (<90 mmHg)");
    if (vitals.doctor_assessment === 'critical') flags.push("Clinical provider indicates critical condition");
    return flags;
  }

  private static computeABCDE(vitals: Vitals): ABCDEStatus {
    return {
      A_Airway: vitals.consciousness === 'unconscious' ? "AT RISK" : "OPEN",
      B_Breathing: !vitals.spo2 ? "UNKNOWN" : vitals.spo2 < 90 ? "CRITICAL" : vitals.spo2 < 92 ? "LOW-NORMAL" : "ADEQUATE",
      C_Circulation: !vitals.systolic_bp ? "UNKNOWN" : vitals.systolic_bp < 90 ? "SHOCK" : vitals.systolic_bp < 100 ? "LOW-NORMAL" : vitals.systolic_bp > 180 ? "HYPERTENSIVE" : "ADEQUATE",
      D_Disability: vitals.consciousness === 'unconscious' ? "UNCONSCIOUS" : vitals.consciousness === 'drowsy' ? "DROWSY" : "ALERT",
      E_Exposure: !vitals.temperature ? "UNKNOWN" : (vitals.temperature > 40 || vitals.temperature < 35) ? "CRITICAL" : vitals.temperature > 38 ? "FEVER" : "NORMAL"
    };
  }
}
