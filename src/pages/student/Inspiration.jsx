import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNavigation from '../../components/student/BottomNavigation';

const Inspiration = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Quotes', 'Videos', 'Audio'];

  const wisdomContent = [
    {
      type: 'quote',
      category: 'Quotes',
      tag: 'QUOTE',
      text: '"The only way to do great work is to love what you do."',
      author: 'Steve Jobs',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      likes: '1.2k'
    },
    {
      type: 'video',
      category: 'Videos',
      recommendedBy: 'Mentor Alice',
      expertTag: 'Mindfulness Expert',
      mentorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=450&fit=crop',
      duration: '05:00',
      title: '5 Minute Morning Meditation',
      description: 'Start your day with clarity and peace.',
      tag: 'Video'
    },
    {
      type: 'imageQuote',
      category: 'Quotes',
      tag: 'Daily Focus',
      text: '"Clarity comes from action."',
      backgroundImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=1000&fit=crop',
      likes: '845'
    },
    {
      type: 'podcast',
      category: 'Audio',
      label: 'PODCAST',
      episode: 'Episode 4',
      title: 'Productivity Hacking',
      description: 'Simple tricks to double your output.',
      duration: '12:30'
    }
  ];

  const filteredContent = activeFilter === 'All' 
    ? wisdomContent 
    : wisdomContent.filter(item => item.category === activeFilter);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">
        
        {/* Header */}
        <header className="px-6 pt-10 pb-6 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight leading-tight">Daily Wisdom</h1>
            <p className="text-[14px] font-medium text-gray-400 mt-1">Tuesday, Oct 24</p>
          </div>
          <button className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0f172a] active:scale-90 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          </button>
        </header>

        {/* Filter Bar */}
        <div className="px-6 mb-8 flex gap-3 overflow-x-auto no-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2.5 rounded-full text-[14px] font-bold whitespace-nowrap transition-all border ${
                activeFilter === filter 
                  ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-md' 
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Content Feed */}
        <div className="px-6 space-y-8">
          <AnimatePresence mode="popLayout">
            {filteredContent.map((item, idx) => (
              <motion.div
                key={item.title || item.text}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.1 }}
                className="w-full"
              >
                {item.type === 'quote' && (
                  <div className="bg-white rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-50">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg inline-block mb-6">{item.tag}</span>
                    <h2 className="text-[20px] font-bold text-[#1e293b] leading-snug mb-8">{item.text}</h2>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={item.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                        <span className="text-[14px] font-bold text-gray-700">{item.author}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <svg className="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                          <span className="text-[13px] font-bold">{item.likes}</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </div>
                    </div>
                  </div>
                )}

                {item.type === 'video' && (
                  <div className="bg-white rounded-[40px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-50 p-3">
                    <div className="px-5 pt-5 pb-4 flex items-center gap-3">
                      <img src={item.mentorAvatar} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                      <div>
                        <h4 className="text-[14px] font-bold text-[#1e293b]">Recommended by {item.recommendedBy}</h4>
                        <p className="text-[12px] font-medium text-gray-400">{item.expertTag}</p>
                      </div>
                    </div>
                    <div className="relative rounded-[32px] overflow-hidden group">
                      <img src={item.thumbnail} className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center text-[#1e293b] shadow-xl backdrop-blur-sm"
                        >
                          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v14c0 .86.84 1.4 1.58.97l11-7a1 1 0 0 0 0-1.72l-11-7A1 1 0 0 0 8 5.14z" /></svg>
                        </motion.button>
                      </div>
                      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[11px] font-black px-3 py-1 rounded-lg">
                        {item.duration}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-[18px] font-black text-[#1e293b]">{item.title}</h3>
                      <p className="text-[14px] font-medium text-gray-400 mt-1 mb-6">{item.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg">{item.tag}</span>
                        <div className="flex items-center gap-5">
                          <svg className="w-5 h-5 text-gray-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                          <svg className="w-5 h-5 text-gray-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {item.type === 'imageQuote' && (
                  <div className="relative rounded-[40px] overflow-hidden aspect-[4/5] shadow-2xl group cursor-pointer">
                    <img src={item.backgroundImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-10 flex flex-col justify-end">
                      <span className="w-max px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-[11px] font-black text-white uppercase tracking-widest mb-4 border border-white/30">{item.tag}</span>
                      <h2 className="text-[26px] font-bold text-white leading-tight mb-8">{item.text}</h2>
                      <div className="flex items-center justify-between border-t border-white/20 pt-6">
                        <div className="flex items-center gap-2 text-white">
                          <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                          <span className="text-[15px] font-bold">{item.likes} likes</span>
                        </div>
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {item.type === 'podcast' && (
                  <div className="bg-white rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-50">
                    <div className="flex items-start justify-between mb-8">
                       <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#1e293b]">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                          <h4 className="text-[13px] font-bold text-gray-400">{item.episode}</h4>
                        </div>
                       </div>
                       <span className="text-[12px] font-bold text-gray-300">{item.duration}</span>
                    </div>
                    <h3 className="text-[20px] font-black text-[#1e293b] mb-2">{item.title}</h3>
                    <p className="text-[14px] font-medium text-gray-400 mb-8">{item.description}</p>
                    
                    <div className="bg-[#f8fafc] rounded-[24px] p-4 flex items-center gap-6">
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        className="w-12 h-12 bg-[#1e293b] rounded-full flex items-center justify-center text-white shadow-lg"
                      >
                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v14c0 .86.84 1.4 1.58.97l11-7a1 1 0 0 0 0-1.72l-11-7A1 1 0 0 0 8 5.14z" /></svg>
                      </motion.button>
                      <div className="flex-1 flex items-center justify-between gap-1 h-8">
                        {[40, 60, 30, 80, 50, 70, 40, 90, 60, 80, 40, 60, 30, 70].map((h, i) => (
                          <div 
                            key={i} 
                            style={{ height: `${h}%` }} 
                            className={`w-0.5 rounded-full ${i % 3 === 0 ? 'bg-[#1e293b]' : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>

      <BottomNavigation />
    </div>
  );
};

export default Inspiration;
