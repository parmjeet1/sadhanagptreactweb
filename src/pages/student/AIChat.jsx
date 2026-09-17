import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import BottomNavigation from '../../components/student/BottomNavigation';
import { getRequest } from '../../services/api';

const AIChat = () => {
    const navigate = useNavigate();
    const { userDetails } = useOutletContext();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        let isMounted = true;
        const initAnalysis = async () => {
            if (!userDetails?.user_id || analyticsData) return;
            
            // Initial greeting
            setMessages([{
                role: 'ai',
                text: `Hare Krishna, ${userDetails?.name || 'there'}! Ask any question or request a Sadhana report analysis. We will bundle your 7-day activity metrics into a file and open ChatGPT for you!`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);

            setIsTyping(false); 
            getRequest('/student-activities-analytics', { user_id: userDetails.user_id, filter: '7days' }, async (response) => {
                if (!isMounted) return;
                const rawData = response.data?.data || response.data;
                setAnalyticsData(rawData);
            });
        };
        initAnalysis();
        return () => { isMounted = false; };
    }, [userDetails?.user_id]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const handleSendMessage = async (e, directText = null) => {
        if (e) e.preventDefault();
        const messageText = directText || input;
        if (!messageText.trim()) return;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const userMsg = {
            role: 'user',
            text: messageText,
            time: timestamp
        };
        
        setInput('');
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        const studentName = userDetails?.name || 'Student';
        const userId = userDetails?.user_id || 'N/A';
        const formattedAnalytics = analyticsData ? JSON.stringify(analyticsData, null, 2) : 'No 7-day analytics available';

        const fileContent = `==================================================
SADHANA GPT - STUDENT ACTIVITY & COGNITIVE DATA
==================================================
Student Name: ${studentName}
User ID: ${userId}
Generated Date: ${new Date().toLocaleString()}

--------------------------------------------------
USER PROMPT / INSTRUCTION:
--------------------------------------------------
${messageText}

--------------------------------------------------
7-DAY SADHANA ACTIVITY ANALYTICS & LOGS:
--------------------------------------------------
${formattedAnalytics}

==================================================
INSTRUCTIONS FOR CHATGPT:
Please act as an expert Behavioral and Spiritual Sadhana Coach. 
Analyze the student's activity data above and answer the user's prompt thoughtfully with actionable insights.
==================================================`;

        const sanitizedFileName = `Sadhana_Data_${studentName.replace(/\s+/g, '_')}.txt`;

        // 1. Download data file
        try {
            const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = sanitizedFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("File download error:", err);
        }

        // 2. Copy full prompt & data to clipboard
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(fileContent);
            }
        } catch (err) {
            console.error("Clipboard copy error:", err);
        }

        setIsTyping(false);
        showToast("Data file downloaded & prompt copied to clipboard!");

        // 3. Render notification in chat feed
        setMessages(prev => [...prev, {
            role: 'ai',
            text: `📁 **Data File Ready & Copied!**\n\nYour 7-day activity metrics and prompt have been saved to **\`${sanitizedFileName}\`** and copied to your clipboard.\n\nOpening ChatGPT...`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        // 4. Directly open ChatGPT app / web
        const encodedPrompt = encodeURIComponent(`[Sadhana GPT Context Attached for ${studentName}]\nPrompt: ${messageText}`);
        const chatGptUrl = `https://chatgpt.com/?q=${encodedPrompt}`;

        setTimeout(() => {
            window.open(chatGptUrl, '_blank');
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans pb-40">
            <div className="w-full max-w-md mx-auto relative min-h-screen flex flex-col">

                {/* Header */}
                <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 py-5 max-w-md mx-auto shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center text-[#0f172a] hover:bg-gray-50 active:scale-90 transition-all border border-gray-100">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <h1 className="text-[17px] font-black text-[#0f172a] leading-none tracking-tight">{userDetails?.name || ""}</h1>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#1a73e8] animate-pulse"></div>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">ChatGPT Assistant</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1a73e8]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    </div>
                </header>

                {/* Toast notification */}
                {toastMessage && (
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white px-5 py-3 rounded-full text-[13px] font-bold shadow-xl border border-gray-700 animate-in fade-in slide-in-from-top-3">
                        {toastMessage}
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-1 pt-28 px-4 space-y-5 overflow-y-auto pb-10">
                    <AnimatePresence>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
                            >
                                {msg.role === 'ai' && (
                                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#1a73e8] to-[#6366f1] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                )}

                                <div className={`max-w-[85%] rounded-[24px] shadow-sm ${
                                    msg.role === 'user'
                                        ? 'bg-[#1a73e8] rounded-tr-none px-5 py-4 text-white'
                                        : 'bg-white border border-gray-100 rounded-tl-none px-5 py-4 text-[#334155]'
                                }`}>
                                    <p className="text-[14.5px] leading-relaxed font-semibold whitespace-pre-line">{msg.text}</p>
                                    <span className={`text-[10px] font-black uppercase tracking-widest mt-3 block ${
                                        msg.role === 'user' ? 'text-white/50' : 'text-gray-300'
                                    }`}>
                                        {msg.time}
                                    </span>
                                </div>
                            </motion.div>
                        ))}

                        {isTyping && (
                            <motion.div
                                key="typing-indicator" 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                                    <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                                </div>
                                <div className="bg-white border border-gray-100 px-5 py-4 rounded-[24px] rounded-tl-none">
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

                {/* Suggestion Chips */}
                {!isTyping && (
                    <div className="px-4 mb-3 flex gap-2 overflow-x-auto no-scrollbar">
                        {['Perform Weekly Analysis', 'Best routine?', 'How to improve?'].map(chip => (
                            <button
                                key={chip}
                                onClick={() => handleSendMessage(null, chip)}
                                className="px-4 py-2 bg-white border border-gray-100 rounded-full text-[12px] font-black text-gray-500 whitespace-nowrap shadow-sm hover:border-blue-200 hover:text-[#1a73e8] transition-all"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Bar */}
                <div className="bg-white/80 backdrop-blur-md border-t border-gray-100 px-4 py-4 pb-28">
                    <form onSubmit={handleSendMessage} className="relative max-w-md mx-auto">
                        <input
                            type="text"
                            placeholder="Type message & open in ChatGPT..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full bg-[#f8fafc] border-2 border-transparent focus:bg-white focus:border-blue-100 rounded-full py-4 pl-6 pr-14 text-[15px] font-bold text-[#0f172a] transition-all placeholder:text-gray-300 outline-none shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#1a73e8] text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-90 transition-all disabled:opacity-30"
                        >
                            <svg className="w-5 h-5 rotate-45 -mt-0.5 -ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9-7-9-7V11H3v2h9v4z" /></svg>
                        </button>
                    </form>
                </div>

            </div>
            <BottomNavigation />
        </div>
    );
};

export default AIChat;
