import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import { postRequest } from '../../services/api';

const callAI = async (messages) => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;
    
    // Prefix system instruction to the first message if needed implicitly
    const contents = messages.map(m => ({
        role: m.role === 'model' || m.role === 'ai' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || m.text }]
    }));

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "AI request failed");
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Empty response from AI");
    }

    return data.candidates[0].content.parts[0].text;
};

// Premium Markdown Renderer
const MarkdownMessage = ({ text }) => {
    const renderInline = (text) => {
        const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-black text-[#1a73e8]">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={i} className="italic text-gray-600">{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };

    const renderLine = (line, idx) => {
        const cleanLine = line.trim();
        if (!cleanLine) return <div key={idx} className="h-3" />;

        if (line.startsWith('## ')) {
            const title = line.replace('## ', '');
            return (
                <div key={idx} className="mt-8 mb-4 flex items-center gap-3 text-[#1a73e8]">
                    <div className="w-1.5 h-6 rounded-full bg-[#1a73e8]" />
                    <h2 className="text-[17px] font-black uppercase tracking-tight">{title}</h2>
                </div>
            );
        }

        if (cleanLine.startsWith('**') && cleanLine.endsWith(':**')) {
            const title = cleanLine.replace(/\*\*|:/g, '');
            return (
                <div key={idx} className="mt-5 mb-2 flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit bg-gray-100 text-gray-700">
                    <span className="text-[14px]">📝</span>
                    <span className="text-[12px] font-black uppercase tracking-widest">{title}</span>
                </div>
            );
        }

        if (line.match(/^[\*\-]\s+/)) {
            const content = line.replace(/^[\*\-]\s+/, '');
            return (
                <div key={idx} className="flex items-start gap-3 my-2.5 pl-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mt-[8px] shrink-0" />
                    <p className="text-[14.5px] leading-[1.6] text-[#334155] font-bold">
                        {renderInline(content)}
                    </p>
                </div>
            );
        }

        if (line.match(/^\d+\.\s+/)) {
            const num = line.match(/^(\d+)\./)[1];
            const content = line.replace(/^\d+\.\s+/, '');
            return (
                <div key={idx} className="bg-white border border-gray-100 rounded-[20px] p-4 my-3 shadow-sm flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#1a73e8] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                        {num}
                    </span>
                    <p className="text-[14px] leading-relaxed text-[#334155] font-bold">
                        {renderInline(content)}
                    </p>
                </div>
            );
        }

        return <p key={idx} className="text-[14.5px] leading-[1.7] text-[#475569] my-1.5 font-bold">{renderInline(line)}</p>;
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            {text.split('\n').map((line, idx) => renderLine(line, idx))}
        </div>
    );
};

const CounsellorAiChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userDetails } = useOutletContext();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      category: 'System',
      text: 'Welcome to the Counsellor AI Assistant. How can I help you analyze your mentees today?',
      icon: 'bot'
    }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    const runAnalysis = async () => {
      const { student_ids, date_from, date_to, studentsData, reports, fromReport } = location.state || {};
      
      if (fromReport && reports) {
        setAnalyticsData(reports);
        setIsAnalyzing(true);
        try {
          const systemContext = `You are a high-level data analyst for a counsellor. Your goal is to analyze the daily reports of multiple students over a time period and present actionable insights. 
          Here is the JSON dataset: \n${JSON.stringify(reports)}\n\n
          Provide a professional, easy-to-read summary assessing who is doing well, who is struggling, and clear recommendations. Use bullet points and bolding.`;
          
          const result = await callAI([{text: systemContext, role: 'user'}]);
          setMessages([
            { role: 'user', category: 'You', text: 'Generate Bulk AI Report' },
            { role: 'ai', category: 'AI Analysis', text: result, icon: 'bot' }
          ]);
        } catch (err) {
          setMessages(prev => [...prev, { role: 'ai', category: 'Error', text: `AI analysis failed: ${err.message}`, icon: 'bot' }]);
        }
        setIsAnalyzing(false);
        return;
      }

      if (student_ids && studentsData) {
        setIsAnalyzing(true);
        setMessages(prev => [
          ...prev,
          {
            role: 'ai',
            category: 'Status',
            text: `Gathering and analyzing activity data for ${studentsData.length} students from the database... Please wait.`,
            icon: 'bot'
          }
        ]);

        const payload = {
          user_id: userDetails.user_id,
          student_ids,
          date_from,
          date_to
        };

        postRequest('/bulk-ai-report', payload, async (response) => {
          if (response.data?.status === 1) {
            const reportData = response.data.data;
            setAnalyticsData(reportData);

            try {
              const systemContext = `You are a high-level data analyst for a counsellor. Your goal is to analyze the daily reports of multiple students over a time period and present actionable insights. 
              Here is the JSON dataset: \n${JSON.stringify(reportData)}\n\n
              Provide a professional, easy-to-read summary assessing who is doing well, who is struggling, and clear recommendations. Use bullet points and bolding.`;
              
              const result = await callAI([{text: systemContext, role: 'user'}]);

              setMessages([
                { role: 'user', category: 'You', text: 'Generate Bulk AI Report' },
                { role: 'ai', category: 'AI Analysis', text: result, icon: 'bot' }
              ]);
            } catch (err) {
              setMessages(prev => [
                ...prev,
                { role: 'ai', category: 'Error', text: `AI analysis failed: ${err.message}`, icon: 'bot' }
              ]);
            }
          } else {
             setMessages(prev => [
                ...prev,
                { role: 'ai', category: 'Error', text: `Failed to fetch data from database: ${response.data?.message || 'Server Error'}`, icon: 'bot' }
             ]);
          }
          setIsAnalyzing(false);
        });
      }
    };

    runAnalysis();
    // eslint-disable-next-line
  }, [location.state, userDetails.user_id]);

  const handleSendMessage = async () => {
    if (!input.trim() || isAnalyzing) return;

    const userMsg = {
      role: 'user',
      category: 'You',
      text: input,
      icon: 'user'
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsAnalyzing(true);

    try {
      const historyContext = messages.map(m => ({ text: m.text, role: m.role }));
      
      let finalMessages = [];
      if (analyticsData) {
         finalMessages = [
           {role: 'user', text: `Context Database: ${JSON.stringify(analyticsData)}`},
           ...historyContext,
           {role: 'user', text: input}
         ];
      } else {
         finalMessages = [...historyContext, {role: 'user', text: input}];
      }

      const result = await callAI(finalMessages);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          category: 'AI Assistant',
          text: result,
          icon: 'bot'
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {role: 'ai', text: "Sorry, I ran into an error connecting to the AI."}]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32">
      <div className="w-full max-w-md mx-auto">
        
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 py-4 max-w-md mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-90 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-[18px] font-black text-[#0f172a] leading-none tracking-tight">Mentee Analysis</h1>
              <p className="text-[12px] font-bold text-[#1a73e8] mt-1">AI Assistant</p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-90 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
        </header>

        <div className="pt-24 px-6">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 px-1">AI Interaction</h3>
          
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#1a73e8] shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                </div>
                <div className="bg-white rounded-[24px] rounded-tl-none p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex-1 overflow-hidden">
                    {msg.role === 'ai' && msg.category !== 'Status' && msg.category !== 'Error' && msg.category !== 'System' ? (
                       <MarkdownMessage text={msg.text} />
                    ) : (
                       <div className="text-[14.5px] leading-relaxed text-[#1e293b] whitespace-pre-wrap font-bold ai-content">
                         {msg.text}
                       </div>
                    )}
                </div>
              </motion.div>
            ))}

            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-1 mt-4"
              >
                <div className="flex gap-1">
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]"></motion.span>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]"></motion.span>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]"></motion.span>
                </div>
                <span className="text-[12px] font-bold text-[#1a73e8]">AI is thinking...</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div className="fixed bottom-28 left-0 right-0 px-6 max-w-md mx-auto z-40">
          <div className="relative">
            <input 
              type="text"
              placeholder="Ask AI about mentees' progress..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full bg-white border-2 border-gray-100 rounded-full py-4 pl-6 pr-14 text-[15px] font-bold text-[#0f172a] shadow-xl shadow-gray-200/50 outline-none focus:border-[#1a73e8]/20 transition-all placeholder:text-gray-300"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isAnalyzing}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-transparent flex items-center justify-center transition-all ${isAnalyzing ? 'text-gray-300' : 'text-[#1a73e8] active:scale-90'}`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>

      </div>
      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorAiChat;
