import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';

const CounsellorAddContent = () => {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState('Text Quote');
  const [quoteContent, setQuoteContent] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [audience, setAudience] = useState('Karanpur base');
  const [label, setLabel] = useState('First year');

  const groupLabelsMap = {
    'Karanpur base': ['First year', 'Second year', 'Third year'],
    'DIT base': ['First year', 'Second year'],
    'UIT base': ['First year', 'Third year']
  };

  const groups = Object.keys(groupLabelsMap);
  const availableLabels = groupLabelsMap[audience] || [];

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
                    className={`flex-shrink-0 relative flex flex-col items-center justify-center w-[100px] h-[100px] rounded-full transition-all duration-200 border-2 active:scale-95 ${isActive
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

          {/* Dynamic Content Input Area */}
          <div className="mb-8">
            <h2 className="text-[12px] font-bold text-[#64748b] tracking-wider mb-3">
              {contentType === 'Text Quote' ? 'QUOTE CONTENT' : contentType === 'Image' ? 'UPLOAD IMAGE' : 'YOUTUBE LINK'}
            </h2>

            {contentType === 'Text Quote' && (
              <div className="border border-gray-200 rounded-[28px] overflow-hidden shadow-sm bg-white focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all">
                {/* Formatting Toolbar Mock */}
                <div className="flex items-center gap-2 p-3 border-b border-gray-100 bg-gray-50/50">
                  <button className="w-8 h-8 rounded hover:bg-white hover:shadow-sm text-gray-500 flex items-center justify-center transition-all font-serif font-bold">B</button>
                  <button className="w-8 h-8 rounded hover:bg-white hover:shadow-sm text-gray-500 flex items-center justify-center transition-all font-serif italic">I</button>
                  <button className="w-8 h-8 rounded hover:bg-white hover:shadow-sm text-gray-500 flex items-center justify-center transition-all underline">U</button>
                  <div className="w-px h-5 bg-gray-300 mx-1"></div>
                  <button className="w-8 h-8 rounded hover:bg-white hover:shadow-sm text-gray-500 flex items-center justify-center transition-all">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" /></svg>
                  </button>
                  <button className="w-8 h-8 rounded hover:bg-white hover:shadow-sm text-gray-500 flex items-center justify-center transition-all">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" /></svg>
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={quoteContent}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) setQuoteContent(e.target.value);
                    }}
                    placeholder="Type the inspirational quote here..."
                    className="w-full min-h-[140px] p-5 text-[16px] text-[#0f172a] placeholder-[#94a3b8] focus:outline-none resize-none bg-transparent"
                  />
                  <div className="absolute bottom-3 right-5 text-[12px] font-medium text-[#c0cbd8]">
                    {quoteContent.length}/500
                  </div>
                </div>
              </div>
            )}

            {contentType === 'Image' && (
              <div className="w-full h-[200px] border-2 border-dashed border-[#cbd5e1] rounded-[28px] bg-[#f8fafc] flex flex-col items-center justify-center hover:bg-[#f1f5f9] hover:border-[#94a3b8] transition-all cursor-pointer group">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-[#1a73e8] mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-[14px] font-bold text-[#0f172a]">Click to upload image</p>
                <p className="text-[12px] text-[#94a3b8] mt-1">PNG, JPG or WEBP (max. 5MB)</p>
              </div>
            )}

            {contentType === 'YouTube' && (
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-red-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="Paste YouTube loop / video link..."
                  className="w-full p-5 pl-14 border border-gray-200 rounded-[28px] text-[16px] text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all bg-white shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Audience Dropdown */}
          <div className="mb-8">
            <h2 className="text-[12px] font-bold text-[#64748b] tracking-wider mb-3">AUDIENCE</h2>
            <div className="relative">
              <select
                value={audience}
                onChange={(e) => {
                  setAudience(e.target.value);
                  setLabel(groupLabelsMap[e.target.value][0]);
                }}
                className="w-full appearance-none p-4 pl-12 border border-gray-200 text-[#0f172a] rounded-[24px] bg-white shadow-sm hover:border-gray-300 transition-colors focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none font-semibold text-[15px] cursor-pointer"
              >
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <div className="absolute left-4 top-4 pointer-events-none text-[#64748b]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <svg className="absolute right-4 top-4 w-5 h-5 text-[#94a3b8] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <p className="text-[12px] text-[#94a3b8] font-medium mt-2 px-1">Visible to all mentees in the selected audience.</p>
          </div>

          {/* Select Label Dropdown */}
          <div className="mb-10">
            <h2 className="text-[12px] font-bold text-[#64748b] tracking-wider mb-3">SELECT LABEL</h2>
            <div className="relative">
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full appearance-none p-4 pl-12 border border-gray-200 text-[#0f172a] rounded-[24px] bg-white shadow-sm hover:border-gray-300 transition-colors focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none font-semibold text-[15px] cursor-pointer"
              >
                {availableLabels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <div className="absolute left-4 top-4 pointer-events-none text-[#94a3b8]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <svg className="absolute right-4 top-4 w-5 h-5 text-[#94a3b8] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
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
