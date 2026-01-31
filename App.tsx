
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  TriageLevel, 
  Message, 
  Language, 
  PatientState
} from './types';
import { TRANSLATIONS, RED_FLAGS, EMERGENCY_CONTACT_NUMBER } from './constants';
import { geminiService } from './services/geminiService';
import { 
  Activity, 
  Send, 
  ShieldAlert, 
  LifeBuoy,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  WifiOff,
  Zap,
  PhoneCall,
  CheckCircle2,
  Clock,
  MessageSquare,
  HeartPulse,
  Info,
  Copy,
  ExternalLink
} from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState<Language>('en');
  const [isTyping, setIsTyping] = useState(false);
  const [patient, setPatient] = useState<PatientState & { isOffline?: boolean } | null>(null);
  const [showVitals, setShowVitals] = useState(false);
  const [sosHistory, setSosHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const welcomeMsg: Message = {
      id: '1',
      role: 'assistant',
      content: TRANSLATIONS.welcome[lang],
      timestamp: Date.now()
    };
    setMessages([welcomeMsg]);
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const data = await geminiService.processEmergencyChat(input, lang);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${data.aiExplanation}\n\n**Action Steps:**\n${data.firstAid}`,
        timestamp: Date.now()
      };

      setPatient({
        symptoms: [input, ...(patient?.symptoms || [])],
        vitals: data.vitals,
        triage: data.triage,
        language: lang,
        isOffline: data.isOffline
      });

      if (data.triage.priority !== TriageLevel.STABLE) {
        setShowVitals(true);
      }
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const clinicalSummary = useMemo(() => {
    if (!patient) return "";
    const p = patient.triage;
    const v = patient.vitals;
    const time = new Date().toLocaleTimeString();
    
    return `🚨 EMERGENCY TRIAGE [${time}] 🚨
Priority: ${p.priority} (Score: ${p.score}/10)
Symptoms: ${patient.symptoms[0] || 'Unknown'}
ABC Status: A:${p.abcde_status.A_Airway}, B:${p.abcde_status.B_Breathing}, C:${p.abcde_status.C_Circulation}
Vitals: SBP:${v.systolic_bp || '?'}, HR:${v.heart_rate || '?'}, O2:${v.spo2 || '?'}%
REQ: Immediate response needed.`.trim();
  }, [patient]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(clinicalSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTriageTheme = (level: TriageLevel) => {
    switch (level) {
      case TriageLevel.CRITICAL: return 'bg-rose-500 text-white shadow-rose-200';
      case TriageLevel.URGENT: return 'bg-amber-500 text-white shadow-amber-200';
      case TriageLevel.STABLE: return 'bg-emerald-500 text-white shadow-emerald-200';
      default: return 'bg-stone-200 text-stone-600';
    }
  };

  const cleanNumber = EMERGENCY_CONTACT_NUMBER.replace(/\D/g, '');
  const iosSeparator = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?';

  return (
    <div className="min-h-screen bg-[#fdfcfb] flex flex-col max-w-lg mx-auto shadow-[0_0_100px_rgba(0,0,0,0.06)] relative overflow-hidden font-sans antialiased">
      
      {/* Visual Ambiance Blobs */}
      <div className="absolute top-[-5%] left-[-10%] w-80 h-80 bg-rose-100/40 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-15%] w-96 h-96 bg-amber-100/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-0 w-full h-64 bg-indigo-50/40 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Persistent Header */}
      <header className="glass sticky top-0 z-[60] px-6 py-5 flex items-center justify-between border-b border-white/50">
        <div className="flex items-center space-x-3.5">
          <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600 p-2.5 rounded-[1.2rem] shadow-xl shadow-rose-200 transform hover:scale-105 transition-transform duration-300">
            <LifeBuoy className="text-white" size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-extrabold text-stone-900 text-[1.1rem] tracking-tight leading-none">RescueLine</h1>
            <div className="flex items-center mt-1.5 space-x-1.5">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-[0.15em]">Life-Safety Engine v2</span>
            </div>
          </div>
        </div>
        
        <div className="flex bg-stone-100/80 p-1 rounded-2xl border border-white/40 shadow-sm">
          {['en', 'hi', 'mr'].map((l) => (
            <button 
              key={l}
              onClick={() => setLang(l as Language)}
              className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all ${
                lang === l ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* Main Experience */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Connection Alert */}
        {patient?.isOffline && (
          <div className="mx-6 mt-4 bg-amber-50/90 border border-amber-100/50 px-4 py-2.5 rounded-2xl flex items-center justify-between backdrop-blur-md shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600"><WifiOff size={14} /></div>
              <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider">Local Disaster Mode</span>
            </div>
            <span className="text-[9px] text-amber-600/60 font-bold italic">Offline Triage Active</span>
          </div>
        )}

        {/* Clinical Interface (Triage Hub) */}
        {patient && (
          <div className="px-6 py-4">
            <div className={`rounded-[2.5rem] p-6 shadow-2xl transition-all duration-500 border-b-[6px] border-black/10 relative overflow-hidden ${getTriageTheme(patient.triage.priority)}`}>
              
              {/* Shine effect */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

              <div 
                onClick={() => setShowVitals(!showVitals)}
                className="flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-white/25 p-3 rounded-2xl backdrop-blur-md border border-white/20 group-active:scale-90 transition-transform">
                    {patient.triage.priority === TriageLevel.CRITICAL ? <ShieldAlert size={26} strokeWidth={2.5} /> : <Activity size={26} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.1em]">{patient.triage.priority} PRIORITY</h2>
                    <p className="text-[10px] font-bold opacity-75 uppercase tracking-tighter">Verified Assessment</p>
                  </div>
                </div>
                <div className="bg-black/10 px-4 py-2 rounded-2xl flex items-center space-x-2 border border-white/10 hover:bg-black/15 transition-colors">
                  <span className="text-xs font-black tracking-widest">SC: {patient.triage.score}</span>
                  {showVitals ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {showVitals && (
                <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  
                  {/* Emergency Dispatch Center */}
                  {(patient.triage.priority === TriageLevel.CRITICAL || patient.triage.priority === TriageLevel.URGENT) && (
                    <div className="bg-white/15 p-5 rounded-[2rem] border border-white/20 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4 px-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Rescue Channels</p>
                        <button 
                          onClick={copyToClipboard}
                          className="flex items-center space-x-1.5 text-[9px] font-black uppercase bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
                        >
                          {copied ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                          <span>{copied ? 'Copied' : 'Copy Report'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* WhatsApp Anchor */}
                        <a 
                          href={`https://wa.me/${cleanNumber}?text=${encodeURIComponent(clinicalSummary)}`}
                          onClick={() => setSosHistory(prev => ['WHATSAPP', ...prev])}
                          className="bg-white rounded-[1.5rem] p-4 flex flex-col items-center justify-center space-y-2 hover:bg-stone-50 transition-all shadow-md active:scale-95 group"
                        >
                          <MessageSquare className="text-emerald-600 group-hover:scale-110 transition-transform" size={24} strokeWidth={2.5} />
                          <span className="text-[9px] font-black text-stone-900 uppercase">WhatsApp</span>
                        </a>

                        {/* SMS Anchor */}
                        <a 
                          href={`sms:+${cleanNumber}${iosSeparator}body=${encodeURIComponent(clinicalSummary)}`}
                          onClick={() => setSosHistory(prev => ['SMS', ...prev])}
                          className="bg-white rounded-[1.5rem] p-4 flex flex-col items-center justify-center space-y-2 hover:bg-stone-50 transition-all shadow-md active:scale-95 group"
                        >
                          <Zap className="text-indigo-600 group-hover:scale-110 transition-transform" size={24} strokeWidth={2.5} />
                          <span className="text-[9px] font-black text-stone-900 uppercase">SMS</span>
                        </a>

                        {/* Voice Call Anchor */}
                        <a 
                          href={`tel:+${cleanNumber}`}
                          onClick={() => setSosHistory(prev => ['CALL', ...prev])}
                          className="bg-white rounded-[1.5rem] p-4 flex flex-col items-center justify-center space-y-2 hover:bg-stone-50 transition-all shadow-md active:scale-95 group"
                        >
                          <PhoneCall className="text-rose-600 group-hover:scale-110 transition-transform animate-gentle" size={24} strokeWidth={2.5} />
                          <span className="text-[9px] font-black text-stone-900 uppercase">Call</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Vitals & ABC Recap */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/10 rounded-3xl p-4 border border-white/10 flex items-center space-x-4">
                       <HeartPulse size={20} className="opacity-60" />
                       <div>
                         <p className="text-[8px] font-black uppercase opacity-60 leading-none mb-1">Heart Rate</p>
                         <p className="text-sm font-black font-mono">{patient.vitals.heart_rate || '--'} <span className="text-[10px] font-normal">bpm</span></p>
                       </div>
                    </div>
                    <div className="bg-black/10 rounded-3xl p-4 border border-white/10 flex items-center space-x-4">
                       <Activity size={20} className="opacity-60" />
                       <div>
                         <p className="text-[8px] font-black uppercase opacity-60 leading-none mb-1">Blood Press</p>
                         <p className="text-sm font-black font-mono">{patient.vitals.systolic_bp || '--'} <span className="text-[10px] font-normal">sys</span></p>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Stream */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-6 no-scrollbar pb-24"
        >
          {/* Welcome Info */}
          <div className="flex justify-center mb-4">
            <div className="bg-white/60 backdrop-blur-md border border-stone-100 px-5 py-3 rounded-[1.5rem] flex items-center space-x-3 shadow-sm">
              <Info size={16} className="text-amber-500" strokeWidth={2.5} />
              <p className="text-[11px] text-stone-600 font-bold leading-tight max-w-[220px] text-center">
                Disaster Response Active. Describe symptoms for clinical prioritization.
              </p>
            </div>
          </div>

          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div 
                className={`max-w-[88%] px-6 py-4 shadow-sm transition-all duration-300 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-[1.8rem] rounded-tr-[0.4rem] shadow-indigo-100 border border-indigo-400/20' 
                    : msg.role === 'system' 
                    ? 'bg-rose-50/80 text-rose-800 border border-rose-100/50 rounded-2xl w-full text-center py-2.5 backdrop-blur-sm'
                    : 'bg-white/90 border border-stone-100/80 text-stone-800 rounded-[1.8rem] rounded-tl-[0.4rem] shadow-stone-200/50 backdrop-blur-md'
                }`}
              >
                <div className={`${msg.role === 'system' ? 'font-black uppercase text-[9px] tracking-[0.2em]' : 'text-[14px] font-semibold'} leading-relaxed whitespace-pre-wrap`}>
                  {msg.content}
                </div>
                {msg.role !== 'system' && (
                  <div className={`text-[8px] mt-2.5 font-bold uppercase tracking-widest opacity-30 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/90 border border-stone-100 rounded-2xl px-5 py-4 shadow-sm backdrop-blur-md">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modern Interaction Bar */}
      <footer className="glass p-6 pb-10 relative z-50 border-t border-white/40">
        <div className="flex items-end space-x-4">
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={TRANSLATIONS.placeholder[lang]}
              className="w-full max-h-36 p-5 bg-stone-100/60 border-2 border-transparent rounded-[2rem] focus:ring-[10px] focus:ring-indigo-100 focus:bg-white focus:border-indigo-500/10 transition-all text-sm text-stone-900 resize-none outline-none placeholder:text-stone-400 font-bold shadow-inner"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 text-white p-5 rounded-[2rem] hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 transition-all active:scale-90 shadow-xl shadow-indigo-200"
          >
            <Send size={24} strokeWidth={3} />
          </button>
        </div>
        
        {/* Quick Triage Chips */}
        <div className="mt-5 flex space-x-2.5 overflow-x-auto no-scrollbar py-1">
          {RED_FLAGS.slice(0, 4).map((flag, idx) => (
            <button
              key={idx}
              onClick={() => setInput(flag)}
              className="whitespace-nowrap px-5 py-2.5 bg-white/70 hover:bg-white text-stone-500 font-extrabold rounded-2xl text-[9px] uppercase tracking-widest transition-all border border-stone-200/50 shadow-sm active:scale-95 backdrop-blur-sm"
            >
              {flag}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default App;
