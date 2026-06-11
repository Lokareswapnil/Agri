import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, X, Sparkles, Volume2, VolumeX, Keyboard, MessageSquare, CornerDownRight, Languages } from 'lucide-react';
import { Product, Customer } from '../types';

interface VoiceAssistantProps {
  products: Product[];
  customers: Customer[];
  lang: 'mr' | 'hi' | 'en';
  onExecuteAction: (action: any, spokenReply: string) => void;
}

// Check for Web Speech API Support
const SpeechRecognition = typeof window !== 'undefined' && (
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
);

export default function VoiceAssistant({ products, customers, lang: defaultLang, onExecuteAction }: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<'mr' | 'hi' | 'en'>(defaultLang);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [statusText, setStatusText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setActiveLang(defaultLang);
  }, [defaultLang]);

  // Handle SpeechSynthesis to vocalize the AI's spokenReply
  const speakResponse = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to match the spoken language context
    if (activeLang === 'mr') {
      utterance.lang = 'mr-IN';
    } else if (activeLang === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    // Attempt to find a suitable voice
    const voices = window.speechSynthesis.getVoices();
    let bestVoice = voices.find(v => v.lang.startsWith(utterance.lang));
    if (!bestVoice && activeLang === 'mr') {
      // Marathi fallback to Hindi if Marathi voice is not installed
      bestVoice = voices.find(v => v.lang.startsWith('hi-IN'));
    }
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.03;
    window.speechSynthesis.speak(utterance);
  };

  // Initialize and trigger Web Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!SpeechRecognition) {
      alert("Speech recognition is not fully supported in your current browser. You can type commands in Devanagari/Marathi below!");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      // Set speech language locales
      if (activeLang === 'mr') {
        rec.lang = 'mr-IN';
        setStatusText('मराठीत बोला... (उदा. "युरिया स्टॉक तपासा")');
      } else if (activeLang === 'hi') {
        rec.lang = 'hi-IN';
        setStatusText('हिंदी में बोलें... (उदा. "१० बैग युरिया बिल करो")');
      } else {
        rec.lang = 'en-IN';
        setStatusText('Speak command... (e.g. "go to inventory")');
      }

      rec.onstart = () => {
        setIsListening(true);
        setTranscription('');
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
        setStatusText(activeLang === 'mr' ? 'आवाज ऐकू आला नाही. पुन्हा प्रयत्न करा.' : 'No speech detected, try writing or click micro.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscription(text);
        submitCommandToAI(text);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Send the transcribed spoken command or manual typing text down to our Server API Endpoint
  const submitCommandToAI = async (command: string) => {
    if (!command.trim()) return;

    setIsProcessing(true);
    setStatusText(activeLang === 'mr' ? 'प्रक्रिया सुरू आहे...' : activeLang === 'hi' ? 'प्रोसेसिंग हो रहा है...' : 'AI thinking...');
    
    try {
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          products,
          customers,
          lang: activeLang
        })
      });

      const data = await response.json();
      
      if (data.spokenReply) {
        setAiReply(data.spokenReply);
        speakResponse(data.spokenReply);
        
        // Execute the visual client action side-effects in standard container state
        if (data.action) {
          onExecuteAction(data.action, data.spokenReply);
        }
      }

      setStatusText('');
    } catch (e) {
      console.error("AI Command request failed:", e);
      setStatusText(activeLang === 'mr' ? 'त्रुटी आढळली. कृपया पुन्हा प्रयत्न करा.' : 'An error occurred. Try again.');
    } finally {
      setIsProcessing(false);
      setInputText('');
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setTranscription(inputText);
    submitCommandToAI(inputText);
  };

  const handleQuickCommand = (cmd: string) => {
    setTranscription(cmd);
    submitCommandToAI(cmd);
  };

  return (
    <>
      {/* Floating Sparkles mic activator - 3D Orb design */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
        {/* Animated holographic concentric radar circles */}
        <div className="absolute w-16 h-16 rounded-full bg-emerald-500/20 rader-wave-1 pointer-events-none" />
        <div className="absolute w-16 h-16 rounded-full bg-emerald-400/10 rader-wave-2 pointer-events-none" />

        <button
          id="voice-assistant-fab"
          type="button"
          onClick={() => {
            setIsOpen(true);
            setAiReply('');
            setTranscription('');
          }}
          className="relative p-5 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white rounded-full shadow-[0_8px_16px_rgba(4,120,87,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:shadow-[0_12px_24px_rgba(4,120,87,0.4)] active:scale-95 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center cursor-pointer group border-2 border-emerald-300/40"
          title="AI Voice Assistant (Marathi / English/ Hindi)"
        >
          <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse bg-emerald-805 rounded-full p-0.5 border border-yellow-200/50 shadow-sm" />
          <Mic size={24} className="group-hover:scale-110 transition-transform duration-200" />
        </button>
      </div>

      {/* Voice Assistant Overlay Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md flex items-end sm:items-center justify-center p-4 z-51 animate-fade-in">
          <div className="glass-panel-3d w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[520px] border border-white/40 transform scale-100 transition-all duration-300 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)]">
            {/* Header */}
            <div className="px-4 py-4 bg-gradient-to-r from-emerald-600 to-emerald-850 text-white flex items-center justify-between shadow-[0_2px_10px_rgba(5,106,78,0.15)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/30 rounded-xl border border-white/15">
                  <Sparkles size={16} className="text-emerald-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm tracking-wide">Krishi-AI Voice Hub</h3>
                  <p className="text-[10px] text-emerald-250 opacity-90">Instant Bilingual Agricultural Assistant</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Mute button */}
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white border border-transparent hover:border-white/10"
                  title={isMuted ? "Unmute Speech output" : "Mute Speech output"}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isListening && recognitionRef.current) {
                      recognitionRef.current.stop();
                    }
                    setIsOpen(false);
                  }}
                  className="p-1.5 hover:bg-rose-500/20 rounded-lg transition-all text-white border border-transparent hover:border-rose-400/20 hover:text-rose-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Language Selection bar with 3D Pill button effect */}
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200/60 flex items-center justify-between">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Languages size={12} className="text-emerald-600" />
                Input Dialect
              </span>
              <div className="flex bg-zinc-200/50 p-0.5 rounded-lg border border-zinc-200">
                {[
                  { code: 'mr', label: 'मराठी' },
                  { code: 'hi', label: 'हिंदी' },
                  { code: 'en', label: 'English' }
                ].map(langBtn => (
                  <button
                    key={langBtn.code}
                    type="button"
                    onClick={() => setActiveLang(langBtn.code as any)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                      activeLang === langBtn.code
                        ? 'bg-emerald-600 text-white shadow-[0_2px_4px_rgba(4,120,87,0.2)]'
                        : 'text-zinc-600 hover:text-zinc-900 border border-transparent hover:bg-zinc-100'
                    }`}
                  >
                    {langBtn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[180px] max-h-[320px]">
              {/* If no dialogue had occurred yet, show instructions */}
              {!transcription && !aiReply && (
                <div className="space-y-4 py-3 text-center">
                  <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-full text-emerald-600 mb-1 border border-emerald-100 relative shadow-sm">
                    <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                    <Mic size={24} className="relative z-10" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-zinc-800">
                      {activeLang === 'mr' ? 'काहीतरी विचारण्यासाठी मरणे बोला' : activeLang === 'hi' ? 'कुछ पूछने के लिए माइक दबाएं' : 'Press microphone or type below'}
                    </h4>
                    <p className="text-[11px] text-zinc-500 max-w-[270px] mx-auto leading-relaxed mt-1">
                      {activeLang === 'mr' 
                        ? 'मी तुमचा स्टॉक अद्ययावत करू शकतो, नवीन शेतकऱ्याचे खाते उघडू शकतो किंवा थेट बिल बनवू शकतो.'
                        : activeLang === 'hi'
                        ? 'मैं आपका स्टॉक बढ़ा सकता हूँ, किसान के बिल बना सकता हूँ और खाते की जांच कर सकता हूँ।'
                        : 'I can increase product stock levels, quickly populate carts/bills, or fetch credit statements.'}
                    </p>
                  </div>
                </div>
              )}

              {/* User Transcribed Command */}
              {transcription && (
                <div className="flex items-start gap-2.5 justify-end animate-fade-in">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-200/80 p-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm">
                    <span className="text-[9px] font-bold text-emerald-700 uppercase block tracking-wider mb-1 flex items-center gap-1 justify-end">
                      YOU
                      <MessageSquare size={10} />
                    </span>
                    <p className="text-xs text-zinc-800 leading-relaxed font-semibold">{transcription}</p>
                  </div>
                </div>
              )}

              {/* AI Executed Response - 3D Card overlay */}
              {aiReply && (
                <div className="flex items-start gap-2.5 animate-fade-in pt-1">
                  <div className="bg-white border border-zinc-200/80 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] border-b-2">
                    <span className="text-[9px] font-bold text-emerald-700 uppercase block tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles size={11} className="text-emerald-500 animate-spin" style={{ animationDuration: '3s' }} />
                      KRISHI ENGINE CO-OP
                    </span>
                    <p className="text-xs text-zinc-900 leading-relaxed font-semibold">{aiReply}</p>
                    <div className="flex justify-end gap-1.5 mt-2.5 pt-1.5 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => speakResponse(aiReply)}
                        className="px-2 py-1 bg-zinc-50 border border-zinc-200 hover:border-emerald-300 text-zinc-700 rounded-md transition-colors flex items-center gap-1 text-[9px] font-bold shadow-3xs cursor-pointer"
                        title="Repeat Audio playback"
                      >
                        <Volume2 size={11} /> Speak Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Waveform visualizer */}
              {isListening && (
                <div className="flex items-center justify-center gap-1.5 py-4">
                  <span className="w-1.5 bg-emerald-600 h-6 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-1.5 bg-emerald-400 h-10 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  <span className="w-1.5 bg-emerald-600 h-8 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></span>
                  <span className="w-1.5 bg-emerald-400 h-11 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 bg-emerald-600 h-5 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              )}

              {/* Status banner */}
              {statusText && (
                <div className="p-2 text-center bg-zinc-50 border border-zinc-150 rounded-xl text-[10px] font-semibold text-zinc-600 leading-none shadow-3xs">
                  {statusText}
                </div>
              )}
            </div>

            {/* Quick Helper Suggestions box with Horizontal Scroll */}
            <div className="px-4 py-3 border-t border-zinc-200/60 bg-zinc-50/50">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Try Speaking / Typing:</span>
              <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {activeLang === 'mr' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickCommand('युरिया ५ बॅग बिल बनवा')}
                      className="whitespace-nowrap px-3 py-1.5 bg-white border border-zinc-250 hover:border-emerald-400 hover:text-emerald-700 shadow-3xs rounded-xl text-[9px] font-bold text-zinc-700 transition-all flex items-center gap-1 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <CornerDownRight size={10} className="text-emerald-500" /> युरिया ५ बॅग बिल बनवा
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCommand('युरिया ५० बॅग्स वाढवा')}
                      className="whitespace-nowrap px-3 py-1.5 bg-white border border-zinc-250 hover:border-emerald-400 hover:text-emerald-700 shadow-3xs rounded-xl text-[9px] font-bold text-zinc-700 transition-all flex items-center gap-1 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <CornerDownRight size={10} className="text-emerald-500" /> युरिया ५० बॅग्स वाढवा
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCommand('राजू पाटील नोंदणी करा गाव पुणे फोन ९0४9६५२८४८')}
                      className="whitespace-nowrap px-3 py-1.5 bg-white border border-zinc-250 hover:border-emerald-400 hover:text-emerald-700 shadow-3xs rounded-xl text-[9px] font-bold text-zinc-700 transition-all flex items-center gap-1 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <CornerDownRight size={10} className="text-emerald-500" /> नवीन शेतकरी राजू पाटील नोंदा
                    </button>
                  </>
                ) : activeLang === 'hi' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickCommand('यूरिया ५ बैग बिल बनाओ')}
                      className="whitespace-nowrap px-3 py-1.5 bg-white border border-zinc-250 hover:border-emerald-400 hover:text-emerald-700 shadow-3xs rounded-xl text-[9px] font-bold text-zinc-700 transition-all flex items-center gap-1 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <CornerDownRight size={10} className="text-emerald-500" /> यूरिया ५ बैग बिल बनाओ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCommand('potash stock check karo')}
                      className="whitespace-nowrap px-3 py-1.5 bg-white border border-zinc-250 hover:border-emerald-400 hover:text-emerald-700 shadow-3xs rounded-xl text-[9px] font-bold text-zinc-700 transition-all flex items-center gap-1 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <CornerDownRight size={10} className="text-emerald-500" /> पोटाश स्टॉक चेक करो
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCommand('alerts dakhva')}
                      className="whitespace-nowrap px-3 py-1.5 bg-white border border-zinc-250 hover:border-emerald-400 hover:text-emerald-700 shadow-3xs rounded-xl text-[9px] font-bold text-zinc-700 transition-all flex items-center gap-1 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <CornerDownRight size={10} className="text-emerald-500" /> वार्निंग/अलर्ट्स पेज खोलो
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickCommand('create bill for 5 bags urea')}
                      className="whitespace-nowrap px-3 py-1.5 bg-white border border-zinc-250 hover:border-emerald-400 hover:text-emerald-700 shadow-3xs rounded-xl text-[9px] font-bold text-zinc-700 transition-all flex items-center gap-1 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <CornerDownRight size={10} className="text-emerald-500" /> create bill for 5 bags urea
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCommand('add 30 bags potash stock')}
                      className="whitespace-nowrap px-3 py-1.5 bg-white border border-zinc-250 hover:border-emerald-400 hover:text-emerald-700 shadow-3xs rounded-xl text-[9px] font-bold text-zinc-700 transition-all flex items-center gap-1 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <CornerDownRight size={10} className="text-emerald-500" /> Restock 30 bags of potash
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Input Action Panel */}
            <div className="p-3 bg-white/90 border-t border-zinc-250/50 flex items-center gap-2">
              {/* Mic Icon button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3.5 rounded-xl cursor-pointer shadow-sm transition-all flex items-center justify-center text-white border-2 ${
                  isListening
                    ? 'bg-rose-600 border-rose-450 hover:bg-rose-500'
                    : 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500 shadow-[0_3px_0_#047857] active:translate-y-[2px] active:shadow-none'
                }`}
                title="Toggle Mic Recording"
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {/* Text Input Form Fallback */}
              <form onSubmit={handleTextSubmit} className="flex-1 flex gap-1.5">
                <input
                  type="text"
                  placeholder={activeLang === 'mr' ? 'मराठीत लिहून विचारू शकता...' : activeLang === 'hi' ? 'हिंदी में लिखकर पूछें...' : 'Type instructions here...'}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isProcessing || isListening}
                  className="flex-1 text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white rounded-xl disabled:opacity-50 font-semibold"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing || isListening}
                  className="p-3 bg-emerald-600 border-2 border-emerald-500 text-white rounded-xl cursor-pointer font-bold flex items-center justify-center shadow-[0_3px_0_#047857] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={12} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
