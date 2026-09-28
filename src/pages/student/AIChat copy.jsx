import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { GoogleGenerativeAI } from "@google/generative-ai";
import BottomNavigation from '../../components/student/BottomNavigation';
import { getRequest } from '../../services/api';

const AIChat = () => {
   const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const chatEndRef = useRef(null);
  const genAI = useRef(new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY));

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Initial fetch of analytics and analysis
    const initAnalysis = async () => {
      if (!userDetails?.user_id) return;
      
      setIsTyping(true);
      getRequest('/student-activities-analytics', { user_id: userDetails.user_id, filter: '7days' }, async (response) => {
        const rawData = response.data?.data || response.data;
        setAnalyticsData(rawData);
        
        await generateInitialAnalysis(rawData);
      });
    };
    
    initAnalysis();
  }, [userDetails?.user_id]);

  const generateInitialAnalysis = async (data) => {
    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
         throw new Error("Missing API Key. Please add VITE_GEMINI_API_KEY to your .env file.");
      }
            const model = genAI.current.getGenerativeModel({ model: "gemini-2.5-flash-lite" });


      const prompt = `
        You are an advanced Behavioral & Spiritual AI Coach. 
        Analyze the following 7-day activity data for ${userDetails.name || 'the student'}:
        ${JSON.stringify(data)}

        Please provide a concise analysis in 3 bullet points:
        1. A "Strength" observation (what they are doing well).
        2. A "Conflict" observation (where patterns show inconsistency).
        3. A "Strategic Growth" tip (a specific, actionable spiritual or behavioral adjustment).

        Keep the tone professional, encouraging, and deeply insightful. Use bullet points.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      setMessages([
        { 
          role: 'ai', 
          text: responseText, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
      setIsTyping(false);
    } catch (err) {
      console.error("Gemini Initial Analysis Error:", err);
      setMessages([{ role: 'ai', text: `Analysis Error: ${err.message || "Please check your .env configuration."}`, time: 'Now' }]);
      setIsTyping(false);
    }
  };

 const handleSendMessage = async (e, directText = null) => {
    if (e) e.preventDefault();
    
    const messageText = directText || input;  // ✅ use direct text if provided
    if (!messageText.trim() || isTyping) return;
setMessages(prev => [...prev, { 
        role: 'user', 
        text: messageText, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }]);
    setInput('');
    setIsTyping(true);  // ✅ also missing
    try {
   
      const model = genAI.current.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // ✅ Include analytics context in every chat message
        const systemContext = analyticsData 
            ? `Context - Student's 7-day activity data: ${JSON.stringify(analyticsData)}\n\n`
            : '';

        const chat = model.startChat({
            history: messages.map(m => ({
                role: m.role === 'ai' ? 'model' : 'user',
                parts: [{ text: m.text }],
            })),
        });

        const result = await chat.sendMessage(systemContext + messageText);  // ✅
        const responseText = result.response.text();

        setMessages(prev => [...prev, { 
            role: 'ai', 
            text: responseText, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
    } catch (err) {
        console.error("Gemini Chat Error:", err);
        setMessages(prev => [...prev, { 
            role: 'ai', 
            text: "I'm unable to process that right now. Let's try again.", 
            time: 'Now' 
        }]);
    } finally {
        setIsTyping(false);
    }
};
// ✅ Add this above your AIChat component or in a separate utils/ai.js file

const callAI = async (messages) => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages  // expects [{ role: 'user'/'assistant', content: '...' }]
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "AI request failed");
    }

    const data = await response.json();
    return data.choices[0].message.content;
};
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-40">
      <div className="w-full max-w-md mx-auto relative min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 py-5 max-w-md mx-auto shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#0f172a] hover:bg-gray-50 active:scale-90 transition-all border border-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-[17px] font-black text-[#0f172a] leading-none tracking-tight">{userDetails?.name || 'Loading...'}</h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                 <div className="w-2 h-2 rounded-full bg-[#1a73e8] animate-pulse"></div>
                 <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Cognitive Analysis</p>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1a73e8]">
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 pt-28 px-6 space-y-8 overflow-y-auto pb-10">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
              >
                {msg.role === 'ai' && (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1a73e8] to-[#6366f1] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                )}
                <div className={`max-w-[80%] p-5 rounded-[28px] shadow-sm relative ${
                  msg.role === 'user' 
                    ? 'bg-[#1a73e8] text-white rounded-tr-none' 
                    : 'bg-white border border-gray-50 text-[#1e293b] rounded-tl-none'
                }`}>
                  <p className="text-[15px] leading-relaxed font-bold whitespace-pre-wrap">
                    {msg.text}
                  </p>
                  <span className={`text-[10px] font-black uppercase tracking-widest mt-3 block ${msg.role === 'user' ? 'text-white/50' : 'text-gray-300'}`}>
                    {msg.time}
                  </span>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
                  <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <div className="bg-white border border-gray-50 px-6 py-4 rounded-[28px] rounded-tl-none">
                   <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                   </div>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </AnimatePresence>
        </div>

        {/* Static Suggestion Chips */}
        {!isTyping && messages.length === 1 && (
           <div className="px-6 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
              {['How to improve?', 'Best routine?', 'Analyze gym data'].map(chip => (
                <button 
                  key={chip}
                  onClick={() => handleSendMessage(null, chip)}
                  className="px-4 py-2 bg-white border border-gray-100 rounded-full text-[12px] font-black text-gray-500 whitespace-nowrap shadow-sm hover:border-blue-100"
                >
                  {chip}
                </button>
              ))}
           </div>
        )}

        {/* Input Bar */}
        <div className="bg-white/80 backdrop-blur-md border-t border-gray-100 px-6 py-6 pb-28">
          <form onSubmit={handleSendMessage} className="relative max-w-md mx-auto">
            <input 
              type="text"
              placeholder="Deep dive into your progress..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-[#f8fafc] border-2 border-transparent focus:bg-white focus:border-blue-100 rounded-full py-4 pl-6 pr-14 text-[15px] font-bold text-[#0f172a] transition-all placeholder:text-gray-300 outline-none shadow-inner"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#1a73e8] text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-90 transition-all disabled:opacity-30"
            >
              <svg className="w-5 h-5 rotate-45 -mt-0.5 -ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9-7-9-7V11H3v2h9v4z"/></svg>
            </button>
          </form>
        </div>

      </div>
      <BottomNavigation />
    </div>
  );
};

export default AIChat;
