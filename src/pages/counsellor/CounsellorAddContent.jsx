import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';

const CounsellorAddContent = () => {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState('Text Quote');
  const [quoteContent, setQuoteContent] = useState('');
  const [audience, setAudience] = useState('All Groups');
  const [label, setLabel] = useState('Morning');

  const contentTypes = [
    {
      id: 'Text Quote',
      title: 'Text Quote',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
        </svg>
      )
    },
    {
      id: 'Image',
      title: 'Image',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      )
    },
    {
      id: 'YouTube',
      title: 'YouTube',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans pb-28">
      {/* Container holding the mobile width cleanly if opened on desktop */}
      <div className="w-full max-w-md mx-auto relative bg-white min-h-screen shadow-sm">
        
        {/* Header */}
        <div className="flex items-center px-4 py-4 sticky top-0 bg-white z-10 border-b border-gray-50">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 flex items-center justify-center text-[#0f172a] active:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-[18px] font-bold text-[#0f172a] ml-4">Add New Content</h1>
        </div>

        {/* Form Container */}
        <div className="px-5 pt-6 pb-20">
          
          {/* Content Type Selector */}
          <div className="mb-8">
            <h2 className="text-[12px] font-bold text-[#64748b] tracking-wider mb-3">CONTENT TYPE</h2>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 pt-1 -ml-1 pl-1">
              {contentTypes.map((type) => {
                const isActive = contentType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id)}
                    className={`flex-shrink-0 relative flex flex-col items-center justify-center w-[100px] h-[100px] rounded-full transition-all duration-200 border-2 active:scale-95 ${
                      isActive 
                        ? 'bg-[#1a73e8] border-[#1a73e8] shadow-[0_4px_16px_rgba(26,115,232,0.4)] text-white' 
                        : 'bg-white border-gray-100 text-[#64748b] hover:border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="mb-2">{type.icon}</div>
                    <span className={`text-[12px] font-semibold ${isActive ? 'text-white' : 'text-[#64748b]'}`}>
                      {type.title}
                    </span>
                    {isActive && (
                      <div className="absolute bottom-3 w-1.5 h-1.5 rounded-full bg-white"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quote Content Textarea */}
          <div className="mb-8">
            <h2 className="text-[12px] font-bold text-[#64748b] tracking-wider mb-3">QUOTE CONTENT</h2>
            <div className="relative">
              <textarea
                value={quoteContent}
                onChange={(e) => {
                  if (e.target.value.length <= 300) setQuoteContent(e.target.value);
                }}
                placeholder="Type the inspirational quote here..."
                className="w-full min-h-[160px] p-5 border border-gray-200 rounded-[28px] text-[16px] text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all resize-none shadow-sm"
              />
              <div className="absolute bottom-5 right-5 text-[13px] font-medium text-[#94a3b8]">
                {quoteContent.length}/300
              </div>
            </div>
          </div>

          {/* Audience Dropdown */}
          <div className="mb-8">
            <h2 className="text-[12px] font-bold text-[#64748b] tracking-wider mb-3">AUDIENCE</h2>
            <button className="w-full flex items-center justify-between p-4 border border-gray-200 text-[#0f172a] rounded-[24px] bg-white shadow-sm hover:border-gray-300 transition-colors active:scale-[0.99]">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-[#64748b] mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
                <span className="font-semibold text-[15px]">{audience}</span>
              </div>
              <svg className="w-5 h-5 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <p className="text-[12px] text-[#94a3b8] font-medium mt-2 px-1">Visible to all mentees in the selected audience.</p>
          </div>

          {/* Select Label Dropdown */}
          <div className="mb-10">
            <h2 className="text-[12px] font-bold text-[#64748b] tracking-wider mb-3">SELECT LABEL</h2>
            <button className="w-full flex items-center justify-between p-4 border border-gray-200 text-[#0f172a] rounded-[24px] bg-white shadow-sm hover:border-gray-300 transition-colors active:scale-[0.99]">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-[#94a3b8] mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
                <span className="font-semibold text-[15px]">{label}</span>
              </div>
              <svg className="w-5 h-5 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <button className="w-full bg-[#1a73e8] text-white rounded-[24px] py-4 text-[16px] font-bold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Publish Post
            </button>
            <button className="w-full text-[#64748b] bg-transparent py-4 text-[16px] font-semibold active:opacity-70 transition-opacity">
              Cancel
            </button>
          </div>

        </div>
      </div>

      {/* Reusable Counsellor Bottom Navigation */}
      <CounsellorBottomNavigation />

    </div>
  );
};

export default CounsellorAddContent;
