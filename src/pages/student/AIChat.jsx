import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../../components/student/BottomNavigation';

const AIChat = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');

  const chatMessages = [
    {
      role: 'ai',
      category: 'Chanting',
      text: 'Consistent timing observed. Consider increasing focus during early morning hours for better absorption.',
      icon: 'bot'
    },
    {
      role: 'ai',
      category: 'Reading',
      text: 'Frequent interruptions detected. Suggest shorter, 15-min focused sessions twice a day.',
      icon: 'bot'
    },
    {
      role: 'ai',
      category: 'Overall Progress',
      text: 'Strong dedication in core pillars. Moving reading time to post-dinner could resolve current scheduling conflicts.',
      icon: 'bot'
    }
  ];

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
              <h1 className="text-[18px] font-black text-[#0f172a] leading-none tracking-tight">Rahul Kumar</h1>
              <p className="text-[12px] font-bold text-[#1a73e8] mt-1">AI Analysis Report</p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-90 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
        </header>

        <div className="pt-24 px-6">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 px-1">AI Interaction</h3>
          
          <div className="space-y-6">
            {chatMessages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#1a73e8] shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                </div>
                <div className="bg-white rounded-[24px] rounded-tl-none p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex-1">
                  <p className="text-[15px] leading-relaxed text-[#1e293b]">
                    <span className="font-black text-[#1a73e8]">{msg.category}:</span> {msg.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="fixed bottom-28 left-0 right-0 px-6 max-w-md mx-auto">
          <div className="relative">
            <input 
              type="text"
              placeholder="Ask AI about this student's progress..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-white border-2 border-gray-100 rounded-full py-4 pl-6 pr-14 text-[15px] font-bold text-[#0f172a] shadow-xl shadow-gray-200/50 outline-none focus:border-[#1a73e8]/20 transition-all placeholder:text-gray-300"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-transparent flex items-center justify-center text-[#1a73e8] active:scale-90 transition-all">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>

      </div>
      <BottomNavigation />
    </div>
  );
};

export default AIChat;
