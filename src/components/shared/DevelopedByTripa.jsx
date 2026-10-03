import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, ChevronRight } from 'lucide-react';

const DevelopedByTripa = ({ className = "", dependency = null }) => {
  const navigate = useNavigate();

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <button
        type="button"
        onClick={() => navigate('/story-behind-sadhanagpt', { state: { dependency } })}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 hover:from-amber-500/20 hover:via-orange-500/20 hover:to-amber-600/20 border border-amber-500/30 shadow-sm text-xs font-bold text-amber-900 transition-all group active:scale-95 cursor-pointer select-none"
        title="Discover the story behind SadhanaGpt"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
        <span className="tracking-tight">Story behind SadhanaGpt</span>
        <ChevronRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};

export default DevelopedByTripa;

