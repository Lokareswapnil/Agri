import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Phone, Send, Calendar, Clock, AlertTriangle, AlertCircle, CheckCircle, ShieldAlert, Smartphone } from 'lucide-react';
import { Customer, Sale } from '../types';
import { Language, TRANSLATIONS } from '../translations';

interface CreditReminderCardProps {
  customer: Customer;
  sales: Sale[];
  lang: Language;
}

export default function CreditReminderCard({ customer, sales, lang }: CreditReminderCardProps) {
  const t = TRANSLATIONS[lang];

  // Specific outstanding bills
  const creditSales = sales.filter(s => 
    s.customerId === customer.id && 
    (s.paymentMethod === 'credit' || s.totalAmount > s.amountPaid)
  );

  // Simulation states
  const [activeSimulation, setActiveSimulation] = useState<'none' | 'sms' | 'whatsapp' | 'call'>('none');
  const [sentReminders, setSentReminders] = useState<Record<string, { sms?: boolean; whatsapp?: boolean; call?: boolean }>>({});
  const [callStage, setCallStage] = useState<number>(0);
  const [callLogs, setCallLogs] = useState<string[]>([]);
  const [activeSaleDetails, setActiveSaleDetails] = useState<{ amount: number; dueDate: string } | null>(null);

  // Real Twilio carrier states
  const [twilioCallStatus, setTwilioCallStatus] = useState<'idle' | 'calling' | 'success' | 'unconfigured' | 'error'>('idle');
  const [twilioCallMsg, setTwilioCallMsg] = useState<string>('');
  const [twilioCallError, setTwilioCallError] = useState<string>('');

  const [twilioSmsStatus, setTwilioSmsStatus] = useState<'idle' | 'sending' | 'success' | 'unconfigured' | 'error'>('idle');
  const [twilioSmsMsg, setTwilioSmsMsg] = useState<string>('');
  const [twilioSmsError, setTwilioSmsError] = useState<string>('');

  const callIntervalRef = useRef<any>(null);
  const cancelCallRef = useRef<boolean>(false);

  const triggerRealTwilioNotification = async (type: 'call' | 'sms', amount: number, dueDate: string) => {
    const messageText = buildReminderMessage(amount, dueDate);
    
    if (type === 'call') {
      setTwilioCallStatus('calling');
      setTwilioCallError('');
      setTwilioCallMsg('Connecting to secure cellular carrier network...');
    } else {
      setTwilioSmsStatus('sending');
      setTwilioSmsError('');
      setTwilioSmsMsg('Sending secure automated cellular message...');
    }

    try {
      const response = await fetch('/api/reminders/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: customer.phone,
          message: messageText,
          type: type
        })
      });

      const data = await response.json();
      
      if (data.status === 'unconfigured') {
        if (type === 'call') {
          setTwilioCallStatus('unconfigured');
          setTwilioCallMsg(data.message);
        } else {
          setTwilioSmsStatus('unconfigured');
          setTwilioSmsMsg(data.message);
        }
      } else if (response.ok && data.success) {
        if (type === 'call') {
          setTwilioCallStatus('success');
          setTwilioCallMsg(data.message || 'Call successfully queued on the cellular network!');
        } else {
          setTwilioSmsStatus('success');
          setTwilioSmsMsg(data.message || 'SMS successfully dispatched to farmer!');
        }
      } else {
        throw new Error(data.error || 'Server error occurred during carrier routing.');
      }
    } catch (error: any) {
      console.error('Twilio notification failed:', error);
      if (type === 'call') {
        setTwilioCallStatus('error');
        setTwilioCallError(error.message || 'Carrier network timed out.');
      } else {
        setTwilioSmsStatus('error');
        setTwilioSmsError(error.message || 'Failed to dispatch text message.');
      }
    }
  };

  // Stop synthesis and timers on close or change or unmount
  useEffect(() => {
    if (activeSimulation !== 'call') {
      cancelCallRef.current = true;
      if (callIntervalRef.current) {
        clearTimeout(callIntervalRef.current);
        callIntervalRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      cancelCallRef.current = false;
    }
    return () => {
      cancelCallRef.current = true;
      if (callIntervalRef.current) {
        clearTimeout(callIntervalRef.current);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeSimulation]);

  // Hook voice command event listener
  useEffect(() => {
    const handleVoiceReminder = (e: any) => {
      const detail = e.detail;
      if (!detail || detail.farmerId !== customer.id) return;
      
      const sale = creditSales[0];
      const unpaid = sale ? (sale.totalAmount - sale.amountPaid) : customer.debt;
      const dueDate = sale ? (sale.dueDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
      const saleId = sale ? sale.id : 'fallback-due';
      
      if (detail.type === 'whatsapp') {
        triggerWhatsAppSimulation(saleId, unpaid, dueDate);
      } else if (detail.type === 'sms') {
        triggerSMSSimulation(saleId, unpaid, dueDate);
      } else {
        triggerCallSimulation(saleId, unpaid, dueDate);
      }
    };
    
    window.addEventListener('krishi-voice-trigger-reminder', handleVoiceReminder as EventListener);
    return () => {
      window.removeEventListener('krishi-voice-trigger-reminder', handleVoiceReminder as EventListener);
    };
  }, [customer.id, creditSales, customer.debt]);

  if (customer.debt <= 0) {
    return (
      <div className="bg-emerald-50/20 border-2 border-emerald-250 rounded-2xl p-6 text-center space-y-2 mt-4">
        <CheckCircle className="text-emerald-600 mx-auto" size={24} />
        <h4 className="text-sm font-bold text-emerald-805 uppercase tracking-wider font-display">Account Fully Cleared</h4>
        <p className="text-xs text-zinc-500 font-semibold">
          This farmer has no active outstanding credit lines or pending tab balances. Excellent standing!
        </p>
      </div>
    );
  }

  // Calculate standard Fallback Due Date (1 month after invoice creation if not explicitly set)
  const getDisplayDueDate = (sale: Sale) => {
    if (sale.dueDate) {
      return sale.dueDate;
    }
    const date = new Date(sale.date);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  const isOverdue = (dueDateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dueDateStr < today;
  };

  const getDaysRemainingStr = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dueDateStr);
    due.setHours(0,0,0,0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue (थकीत)`;
    } else if (diffDays === 0) {
      return "Due today (आज देय)";
    } else {
      return `Due in ${diffDays} days (${diffDays} दिवसांत)`;
    }
  };

  // Build message templates depending on active language
  const buildReminderMessage = (amount: number, dueDate: string) => {
    const formattedDate = new Date(dueDate).toLocaleDateString(lang === 'mr' ? 'mr-IN' : 'en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    if (lang === 'mr') {
      return `नमस्कार ${customer.name}जी, आपणास नम्र स्मरणपत्र आहे की आपल्या कृषी सेवा केंद्राच्या खात्यावरील ₹${amount.toLocaleString('en-IN')} थकबाकीची परतफेडी तारीख ${formattedDate} होती. कृपया लवकरात लवकर भरणा करावा. धन्यवाद!`;
    } else if (lang === 'hi') {
      return `नमस्ते ${customer.name} जी, आपको सूचित किया जाता है कि आपके कृषि सेवा केंद्र खाते का ₹${amount.toLocaleString('en-IN')} बकाया भुगतान की देय तिथि ${formattedDate} थी। कृपया इसे जल्द से जल्द चुकाएं। धन्यवाद!`;
    } else {
      return `Dear ${customer.name}, this is a friendly reminder that your outstanding balance of ₹${amount.toLocaleString('en-IN')} is due on ${formattedDate}. Please arrange to clear this due at your earliest convenience. Thank you!`;
    }
  };

  const triggerSMSSimulation = (saleId: string, amount: number, dueDate: string) => {
    setActiveSimulation('sms');
    setActiveSaleDetails({ amount, dueDate });
    setSentReminders(prev => ({
      ...prev,
      [saleId]: { ...prev[saleId], sms: true }
    }));
    triggerRealTwilioNotification('sms', amount, dueDate);
  };

  const triggerWhatsAppSimulation = (saleId: string, amount: number, dueDate: string) => {
    const messageText = buildReminderMessage(amount, dueDate);
    // Real functional API integration redirecting to WhatsApp!
    const formattedPhone = customer.phone.replace(/[^0-9]/g, '');
    const cleanPhone = formattedPhone.length === 10 ? `91${formattedPhone}` : formattedPhone;
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`;
    
    setSentReminders(prev => ({
      ...prev,
      [saleId]: { ...prev[saleId], whatsapp: true }
    }));
    
    // Open in a new tab securely
    window.open(waUrl, '_blank');
  };

  const speakAndProgress = (stepIdx: number, steps: string[]) => {
    if (cancelCallRef.current) return;
    if (stepIdx >= steps.length) return;

    setCallStage(stepIdx + 1);
    if (stepIdx === 0) {
      setCallLogs([steps[0]]);
    } else {
      setCallLogs(prev => [...prev, steps[stepIdx]]);
    }

    const currentLine = steps[stepIdx];
    const isAi = currentLine.includes('[AI Assistant]');
    const isFarmer = currentLine.includes('[Farmer Response]');
    const isDialogue = isAi || isFarmer;

    if (isDialogue) {
      if (!('speechSynthesis' in window)) {
        const timer = setTimeout(() => {
          speakAndProgress(stepIdx + 1, steps);
        }, 3505);
        callIntervalRef.current = timer;
        return;
      }

      let textToSpeak = currentLine;
      const quoteMatch = currentLine.match(/"([^"]+)"/);
      if (quoteMatch) {
        textToSpeak = quoteMatch[1];
      } else {
        textToSpeak = currentLine.replace(/^\[[^\]]+\]:\s*/, '');
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const hasMarathiHindi = /[\u0900-\u097F]/.test(textToSpeak);

      if (hasMarathiHindi) {
        if (lang === 'mr') {
          utterance.lang = 'mr-IN';
        } else {
          utterance.lang = 'hi-IN';
        }
        utterance.rate = 0.8;
      } else {
        utterance.lang = 'en-IN';
        utterance.rate = 0.9;
      }

      if (isFarmer) {
        utterance.pitch = 0.8; // Deeper tone for farmer responder
      } else {
        utterance.pitch = 1.15; // Brighter tone for AI assistant
      }

      utterance.onend = () => {
        if (cancelCallRef.current) return;
        const timer = setTimeout(() => {
          speakAndProgress(stepIdx + 1, steps);
        }, 1200);
        callIntervalRef.current = timer;
      };

      utterance.onerror = () => {
        if (cancelCallRef.current) return;
        const timer = setTimeout(() => {
          speakAndProgress(stepIdx + 1, steps);
        }, 3000);
        callIntervalRef.current = timer;
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      let waitTime = 2000;
      if (currentLine.includes('Line ringing')) {
        waitTime = 3000;
      }

      const timer = setTimeout(() => {
        speakAndProgress(stepIdx + 1, steps);
      }, waitTime);
      callIntervalRef.current = timer;
    }
  };

  const triggerCallSimulation = (saleId: string, amount: number, dueDate: string) => {
    cancelCallRef.current = false;
    setActiveSimulation('call');
    setActiveSaleDetails({ amount, dueDate });
    setSentReminders(prev => ({
      ...prev,
      [saleId]: { ...prev[saleId], call: true }
    }));

    triggerRealTwilioNotification('call', amount, dueDate);

    const steps = [
      `Initializing direct AI voice call routing to ${customer.name} (${customer.phone})...`,
      `[Line ringing...] 🔔 Calling Rampur regional mobile tower connection...`,
      `[Call Connected!] Mobile picked up. Switching to automated synthesizer.`,
      `[AI Assistant]: "नमस्कार ${customer.name}जी! कृषक बंधू कृषी सेवा केंद्र रामपूर मधून डिजिटल ऑटो-वॉइस बोलत आहे."`,
      `[AI Assistant]: "आपल्या खात्यावर मागील खते आणि बियाण्यांच्या खरेदीचे एकूण ₹${amount} बिल प्रलंबित आहे. आपल्या देय दिनानुसार ही रक्कम भरण्याची मुदत संपलेली आहे."`,
      `[Farmer Response]: "होय भाऊ, मी पुढील आठविड्यात सोयाबीन विकल्यावर येऊन पैसे नक्की जमा करतो."`,
      `[AI Assistant]: "नक्कीच! आम्ही आपल्या खात्यावर 'पुढील आठवड्यात पैसे' जमा होणे अशी नोंद केली आहे. धन्यवाद आणि सुखी शेती!"`,
      `[Call Hook release] Call completed successfully. Status registered: Connected & Promised next week.`
    ];

    if (callIntervalRef.current) {
      clearTimeout(callIntervalRef.current);
    }

    speakAndProgress(0, steps);
  };

  return (
    <div className="space-y-4 border-2 border-dashed border-rose-200/80 p-5 rounded-2xl bg-rose-50/20" id="credit-reminders-panel">
      <div className="flex items-center justify-between border-b border-rose-100 pb-3 flex-wrap gap-2">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-rose-800 uppercase tracking-widest font-display flex items-center gap-1.5 align-middle">
            <ShieldAlert size={14} className="text-rose-605 animate-pulse" />
            ⏰ Credit Due reminders & Collection Center
          </h4>
          <p className="text-[10px] text-zinc-500 font-bold">
            Ask date of payment, track promises, or trigger digital voice call/SMS alerts.
          </p>
        </div>
        
        <span className="text-xs font-black text-rose-700 bg-rose-100/80 px-2 py-1 rounded-lg border border-rose-200">
          ₹{customer.debt.toLocaleString('en-IN')} OUTSTANDING
        </span>
      </div>

      <div className="space-y-3.5">
        {creditSales.map((sale) => {
          const dueDate = getDisplayDueDate(sale);
          const overdue = isOverdue(dueDate);
          const statusStr = getDaysRemainingStr(dueDate);
          const unpaid = sale.totalAmount - sale.amountPaid;

          return (
            <div 
              key={sale.id} 
              className={`p-4 rounded-xl border bg-white shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all ${
                overdue ? 'border-rose-300 bg-rose-50/5' : 'border-zinc-200'
              }`}
            >
              {/* Header inside specific outstanding voucher bar */}
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div className="space-y-0.5 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-zinc-100 text-zinc-650 px-1.5 py-0.5 border rounded">
                      VOUCHER {sale.id.toUpperCase()}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${
                      overdue ? 'bg-rose-550 animate-pulse' : 'bg-amber-500'
                    }`}>
                      {overdue ? 'OVERDUE (थकीत)' : 'ACTIVE LEASE'}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-zinc-400 font-bold pt-1">
                    Booked Date: {new Date(sale.date).toLocaleDateString()} • Method: {sale.paymentMethod.toUpperCase()}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-zinc-500 block font-semibold">Outstanding Debt</span>
                  <span className="text-sm font-extrabold text-rose-700">₹{unpaid.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Items Summary list */}
              <div className="mt-3 py-1.5 px-2 bg-zinc-50 rounded border border-zinc-150 text-[10px] text-zinc-500 italic max-w-full truncate">
                Items: {sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
              </div>

              {/* Promised payment date bar */}
              <div className="mt-3 flex items-center justify-between text-xs py-1.5 px-2.5 bg-zinc-100/60 rounded-lg border">
                <div className="flex items-center gap-1.5 text-zinc-705">
                  <Calendar size={13} className={overdue ? "text-rose-600" : "text-amber-500"} />
                  <span className="font-semibold text-zinc-780">
                    Payment Promise: <strong>{new Date(dueDate).toLocaleDateString()}</strong>
                  </span>
                </div>
                <span className={`text-[10px] font-bold ${overdue ? 'text-rose-600 bg-rose-50 border border-rose-100 px-1.5 rounded' : 'text-zinc-500'}`}>
                  {statusStr}
                </span>
              </div>

              {/* Actions Box */}
              <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2">
                <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-widest block">
                  Click to dispatch automated reminders (स्वयंचलित स्मरणपत्र पाठवा)
                </span>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {/* SMS Button */}
                  <button
                    type="button"
                    onClick={() => triggerSMSSimulation(sale.id, unpaid, dueDate)}
                    className={`p-2.5 rounded-lg border-2 font-bold cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 ${
                      sentReminders[sale.id]?.sms 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-805' 
                        : 'bg-zinc-50 hover:bg-white border-zinc-200 text-zinc-750'
                    }`}
                  >
                    <Smartphone size={13} className={sentReminders[sale.id]?.sms ? "text-emerald-600" : "text-zinc-500"} />
                    <span>{sentReminders[sale.id]?.sms ? 'SMS Sent ✓' : 'Text SMS'}</span>
                  </button>

                  {/* WhatsApp Button */}
                  <button
                    type="button"
                    onClick={() => triggerWhatsAppSimulation(sale.id, unpaid, dueDate)}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700/50 rounded-lg font-bold cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 shadow-[0_2px_0_rgba(16,185,129,0.2)]"
                  >
                    <MessageSquare size={13} className="fill-white" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Call Button */}
                  <button
                    type="button"
                    onClick={() => triggerCallSimulation(sale.id, unpaid, dueDate)}
                    className={`p-2.5 rounded-lg border-2 font-bold cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 ${
                      sentReminders[sale.id]?.call 
                        ? 'bg-purple-50 border-purple-400 text-purple-800' 
                        : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-850'
                    }`}
                  >
                    <Phone size={13} className="text-sky-600" />
                    <span>{sentReminders[sale.id]?.call ? 'Call Placed' : 'Voice Call'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pop up Call Simulation UI Modal */}
      {activeSimulation === 'call' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-805 text-zinc-100 rounded-3xl w-full max-w-sm p-6 space-y-6 shadow-2xl relative overflow-hidden font-mono text-xs">
            {/* Glossy overlay design accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-550/10 rounded-full blur-2xl" />
            
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-bold text-sky-400 tracking-wider uppercase">Krishi Voice AI Center</span>
              </div>
              <button 
                onClick={() => { setActiveSimulation('none'); setCallLogs([]); }} 
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="text-center space-y-1">
              <p className="text-[10px] uppercase text-zinc-450 tracking-widest font-sans">Outgoing Phone Dial simulation</p>
              <h3 className="text-base font-extrabold font-sans text-sky-300 leading-none">{customer.name}</h3>
              <p className="text-zinc-500">{customer.phone}</p>
            </div>

            {/* Simulated Animated telephone receiver */}
            <div className="flex justify-center py-2 animate-bounce">
              <div className="p-4 rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/10">
                <Phone size={22} className="rotate-12 fill-white" />
              </div>
            </div>

            {/* Conversation logger monitor feed */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-56 overflow-y-auto space-y-2.5 shadow-inner">
              {callLogs.map((log, idx) => {
                const isAI = log.includes("[AI Assistant]");
                const isFarmer = log.includes("[Farmer Response]");
                return (
                  <div 
                    key={idx} 
                    className={`p-2 rounded-lg text-[11px] leading-relaxed animate-fade-in ${
                      isAI 
                        ? 'bg-sky-950/40 text-sky-305 border-l-2 border-sky-500' 
                        : isFarmer 
                        ? 'bg-emerald-950/40 text-emerald-305 border-l-2 border-emerald-500' 
                        : 'text-zinc-400 italic'
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>Status: Stage {callStage}/8 Logged</span>
              {callStage < 8 ? (
                <span className="animate-pulse text-sky-450">AI speaking...</span>
              ) : (
                <span className="text-emerald-500 font-bold">Call finished successfully!</span>
              )}
            </div>

            {/* Real Twilio Carrier Status Tracking Box */}
            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl space-y-1.5 font-sans text-left">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400 block font-mono">
                📞 REAL-WORLD TELEPHONY CARRIER
              </span>
              {twilioCallStatus === 'idle' && (
                <div className="flex gap-2 items-center text-[10px] text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-650 animate-pulse" />
                  <span>Preparing carrier link...</span>
                </div>
              )}
              {twilioCallStatus === 'calling' && (
                <div className="flex gap-2 items-center text-[10px] text-sky-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                  <span className="font-semibold text-sky-300 animate-pulse">Dialing mobile cell tower via Twilio...</span>
                </div>
              )}
              {twilioCallStatus === 'success' && (
                <div className="flex flex-col gap-1 text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-xl">
                  <div className="flex gap-2 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-extrabold text-emerald-400">Ringing Outbound Phone Line!</span>
                  </div>
                  <p className="text-[10px] text-zinc-305 leading-tight">
                    {twilioCallMsg}
                  </p>
                </div>
              )}
              {twilioCallStatus === 'unconfigured' && (
                <div className="bg-amber-950/10 border border-amber-900/20 p-2.5 rounded-xl space-y-1 text-[10px] text-amber-300 leading-normal">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="font-extrabold text-amber-400">Twilio Link: Offline (Fallback Only)</span>
                  </div>
                  <p className="text-[9.5px] text-zinc-400 leading-tight">
                    To trigger an **actual cell call** where a robot dialer rings the farmer's real phone, add <code className="text-zinc-200 px-1 py-0.2 bg-zinc-800 rounded font-mono font-bold">TWILIO_ACCOUNT_SID</code>, <code className="text-zinc-200 px-1 py-0.2 bg-zinc-800 rounded font-mono font-bold">TWILIO_AUTH_TOKEN</code>, and <code className="text-zinc-200 px-1 py-0.2 bg-zinc-800 rounded font-mono font-bold">TWILIO_PHONE_NUMBER</code> variables in your Settings secret keys.
                  </p>
                </div>
              )}
              {twilioCallStatus === 'error' && (
                <div className="bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg space-y-1 text-[10px] text-rose-300">
                  <div className="flex gap-2 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-extrabold text-rose-400">Carrier Request Failed</span>
                  </div>
                  <p className="text-[10.5]/8 leading-tight">
                    {twilioCallError}
                  </p>
                </div>
              )}
            </div>

            {/* Close / Hang up button option */}
            <div className="space-y-1.5 font-sans pt-1">
              <button
                onClick={() => { setActiveSimulation('none'); setCallLogs([]); }}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl transition-all cursor-pointer text-center text-xs shadow-md flex items-center justify-center gap-1.5 leading-none"
              >
                <Phone size={13} className="fill-white rotate-[135deg]" />
                <span>Hang Up Connection (कॉल संपवा)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop up SMS Simulation UI Modal */}
      {activeSimulation === 'sms' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xs p-5 space-y-4 shadow-2xl relative border border-zinc-200">
            <div className="text-center space-y-1 border-b pb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle size={20} />
              </div>
              <h4 className="text-sm font-bold text-zinc-900">SMS Reminder Prepared</h4>
              <p className="text-[11px] text-zinc-500">Scheduled text request has been dispatched via simulated carrier. You can also send it directly below.</p>
            </div>

            <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-150 text-xs text-zinc-650 leading-relaxed font-semibold text-left">
              <p className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400 pb-1.5 font-mono">Dispatched Text Payload:</p>
              {buildReminderMessage(activeSaleDetails?.amount || customer.debt, activeSaleDetails?.dueDate || new Date().toISOString())}
            </div>

            {/* Real SMS carrier live state tracker */}
            <div className={`p-3 rounded-2xl text-[11px] space-y-1.5 border text-left ${
              twilioSmsStatus === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : twilioSmsStatus === 'unconfigured' 
                ? 'bg-amber-50/50 border-amber-200 text-amber-800' 
                : twilioSmsStatus === 'error' 
                ? 'bg-rose-50/50 border-rose-200 text-rose-800' 
                : 'bg-zinc-50 border-zinc-200 text-zinc-700'
            }`}>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400 block font-mono">
                📱 TWILIO SMS GATEWAY STATUS
              </span>
              {twilioSmsStatus === 'sending' && (
                <div className="flex gap-2 items-center text-[11px] text-zinc-500 font-semibold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                  <span>Sending carrier cellular text message...</span>
                </div>
              )}
              {twilioSmsStatus === 'unconfigured' && (
                <div className="space-y-1 text-[11px] text-amber-850">
                  <p className="font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Offline (Simulated Link)
                  </p>
                  <p className="text-[10px] text-zinc-500 leading-tight">
                    Add <code className="text-zinc-600 font-bold bg-zinc-100 px-1 py-0.5 rounded font-mono text-[9px]">TWILIO_ACCOUNT_SID</code>, <code className="text-zinc-600 font-bold bg-zinc-100 px-1 py-0.5 rounded font-mono text-[9px]">TWILIO_AUTH_TOKEN</code>, and <code className="text-zinc-600 font-bold bg-zinc-100 px-1 py-0.5 rounded font-mono text-[9px]">TWILIO_PHONE_NUMBER</code> as Secrets to transmit actual cellular messages.
                  </p>
                </div>
              )}
              {twilioSmsStatus === 'success' && (
                <div className="space-y-1 text-[11px] text-emerald-800">
                  <p className="font-extrabold flex items-center gap-1">🟢 Carrier Dispatched Successfully!</p>
                  <p className="text-[10px] text-emerald-750 leading-tight">{twilioSmsMsg}</p>
                </div>
              )}
              {twilioSmsStatus === 'error' && (
                <div className="space-y-1 text-[11px] text-rose-800 font-semibold">
                  <p className="font-extrabold flex items-center gap-1">🔴 Transmission Failed</p>
                  <p className="text-[10px] text-rose-700 leading-tight">{twilioSmsError}</p>
                </div>
              )}
            </div>

            {/* Real Direct SMS Protocol Trigger */}
            <div className="space-y-1.5 pt-1">
              <a
                href={`sms:${customer.phone}?body=${encodeURIComponent(buildReminderMessage(activeSaleDetails?.amount || customer.debt, activeSaleDetails?.dueDate || new Date().toISOString()))}`}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-550 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 font-sans leading-none"
              >
                <Smartphone size={13} />
                <span>Open Device SMS (थेट मेसेज पाठवा)</span>
              </a>
              <button
                onClick={() => setActiveSimulation('none')}
                className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-colors font-sans border cursor-pointer"
              >
                Close Confirmation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
