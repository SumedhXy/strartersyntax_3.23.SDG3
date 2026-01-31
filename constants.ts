
import { TranslationMap } from './types';

export const EMERGENCY_CONTACT_NUMBER = "+917263817410";

export const TRANSLATIONS: TranslationMap = {
  welcome: {
    en: "Emergency AI Triage. Please describe your symptoms or injury. I will help prioritize your care.",
    hi: "आपातकालीन एआई ट्राइएज। कृपया अपने लक्षणों या चोट का वर्णन करें। मैं आपकी देखभाल को प्राथमिकता देने में मदद करूँगा।",
    mr: "आणीबाणी एआय ट्राइएज. कृपया तुमची लक्षणे किंवा इजा सांगा. मी तुमच्या उपचारांना प्राधान्य देण्यास मदत करेन."
  },
  disclaimer: {
    en: "DISCLAIMER: This is an AI triage tool, not a medical diagnosis. In a life-threatening emergency, call for help immediately.",
    hi: "अस्वीकरण: यह एक एआई ट्राइएज टूल है, चिकित्सा निदान नहीं। जीवन-धमकी वाली आपात स्थिति में, तुरंत सहायता के लिए कॉल करें।",
    mr: "डिस्क्लेमर: हे एआय ट्राइएज टूल आहे, वैद्यकीय निदान नाही. जीवाला धोका असल्यास, त्वरित मदतीसाठी कॉल करा."
  },
  critical_alert: {
    en: "CRITICAL: SEEK IMMEDIATE MEDICAL ATTENTION.",
    hi: "गंभीर: तत्काल चिकित्सा सहायता लें।",
    mr: "गंभीर: त्वरित वैद्यकीय मदत घ्या."
  },
  urgent_alert: {
    en: "URGENT: Patient needs medical review soon.",
    hi: "अति आवश्यक: रोगी को जल्द ही चिकित्सा समीक्षा की आवश्यकता है।",
    mr: "तातडीने: रुग्णाला लवकरच वैद्यकीय तपासणीची गरज आहे."
  },
  stable_alert: {
    en: "STABLE: Minor symptoms. Monitor closely.",
    hi: "स्थिर: मामूली लक्षण। बारीकी से निगरानी करें।",
    mr: "स्थिर: किरकोळ लक्षणे. बारकाईने लक्ष ठेवा."
  },
  placeholder: {
    en: "Type your symptoms here...",
    hi: "यहाँ अपने लक्षण लिखें...",
    mr: "तुमची लक्षणे येथे लिहा..."
  },
  send: {
    en: "Send",
    hi: "भेजें",
    mr: "पाठवा"
  }
};

export const RED_FLAGS = [
  "Chest Pain", "Breathing Trouble", "Unconscious", "Heavy Bleeding", 
  "Severe Burn", "Seizure", "Stroke", "Sudden Weakness",
  "सांस लेने में तकलीफ", "छाती में दर्द", "बेहोश", "भारी रक्तस्राव",
  "श्वास घेण्यास त्रास", "छातीत दुखणे", "शुद्ध हरपणे", "अति रक्तस्त्राव"
];
