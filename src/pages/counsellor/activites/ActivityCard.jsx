import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';

const ActivityCard = ({ activity, onProgressUpdate, onEdit }) => {
  const [isCompleted, setIsCompleted] = useState(activity.status === 'Completed');
  
  // Extract max value from progress string (e.g. "12 / 16" -> 16, "30m / 60m" -> 60)
  const extractMax = (progStr) => {
    if (!progStr) return 1;
    const parts = progStr.split('/');
    if (parts.length === 2) return parseFloat(parts[1]) || 1;
    return 1;
  };

  const extractCurrent = (progStr) => {
    if (!progStr) return 0;
    const parts = progStr.split('/');
    if (parts.length > 0) return parseFloat(parts[0]) || 0;
    return 0;
  };

  const extractSuffix = (progStr) => {
    if (!progStr) return '';
    const parts = progStr.split('/');
    if (parts.length === 2 && parts[1].includes('m')) return 'm';
    return '';
  };

  const isBoolean = activity.type === 'YES/NO';
  const maxVal = extractMax(activity.progress);
  const initialCurrent = isCompleted ? maxVal : extractCurrent(activity.progress);
  const suffix = extractSuffix(activity.progress);

  const [currentVal, setCurrentVal] = useState(initialCurrent);
  
  // --- Animation and Drag logic for Slider (COUNT/TIME/DURATION) --- //
  const sliderRef = useRef(null);
  const [sliderWidth, setSliderWidth] = useState(0);

  useEffect(() => {
    if (sliderRef.current) {
      setSliderWidth(sliderRef.current.offsetWidth);
    }
  }, []);

  const handlePointerDown = (e) => {
    if (isBoolean) return; // Slider logic only for measurable targets
    updateScrubber(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (isBoolean || e.buttons !== 1) return;
    updateScrubber(e.clientX);
  };

  const updateScrubber = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    
    // Calculate new raw value and snap to integers
    let newVal = Math.round(percentage * maxVal);
    
    setCurrentVal(newVal);
    
    // Check completion status dynamically
    if (newVal >= maxVal && !isCompleted) {
      setIsCompleted(true);
      if (onProgressUpdate) onProgressUpdate(activity.id, { progress: `${maxVal}${suffix} / ${maxVal}${suffix}`, status: 'Completed' });
    } else if (newVal < maxVal && isCompleted) {
      setIsCompleted(false);
      if (onProgressUpdate) onProgressUpdate(activity.id, { progress: `${newVal}${suffix} / ${maxVal}${suffix}`, status: 'Pending' });
    } else {
        if (onProgressUpdate) onProgressUpdate(activity.id, { progress: `${newVal}${suffix} / ${maxVal}${suffix}`, status: isCompleted ? 'Completed' : 'Pending' });
    }
  };


  // --- Logic for Full Swipe (YES/NO) & Edit options --- //
  const cardControls = useAnimation();
  const cardX = useMotionValue(0);

  const background = useTransform(
    cardX,
    [-80, 0, 80],
    ['#fee2e2', '#ffffff', '#dcfce7']
  );

  const handleCardDragEnd = (event, info) => {
    const swipeRightThreshold = 100;
    const swipeLeftThreshold = -80;

    // Only allow Swipe Right for Boolean types
    if (info.offset.x > swipeRightThreshold) {
      if (isBoolean && !isCompleted) {
        setIsCompleted(true);
        if (onProgressUpdate) onProgressUpdate(activity.id, { status: 'Completed' });
      }
    } else if (info.offset.x < swipeLeftThreshold) {
      if (isBoolean && isCompleted) {
        setIsCompleted(false);
        if (onProgressUpdate) onProgressUpdate(activity.id, { status: 'Pending' });
      } else {
         console.log("Opened edit/delete for", activity.title);
      }
    }

    cardControls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
  };
  
  // Visual Percentage (Used by UI display)
  let displayPercentage = isCompleted ? 100 : (maxVal > 0 ? (currentVal / maxVal) * 100 : 0);
  if (isBoolean && !isCompleted) displayPercentage = 0;
  if (isBoolean && isCompleted) displayPercentage = 100;

  return (
    <div className="relative w-full max-w-md mx-auto mb-4 rounded-2xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100 bg-white group">
      
      {/* Background layer for swipe actions */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-between px-6 z-0"
        style={{ background }}
      >
        <div className="font-bold text-green-700 flex items-center gap-2">
          {isBoolean && !isCompleted && <><svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Complete</>}
        </div>
        <div className="font-bold text-red-700 flex items-center gap-2">
          {isBoolean && isCompleted ? 'Undo' : 'Edit/Options'}
        </div>
      </motion.div>

      {/* Foreground Card */}
      <motion.div
        drag={isBoolean ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleCardDragEnd}
        animate={cardControls}
        style={{ x: isBoolean ? cardX : 0 }}
        className="relative z-10 w-full h-full bg-white rounded-2xl p-5 select-none"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center`} style={{ backgroundColor: activity.iconBgColor, color: activity.iconColor }}>
              {activity.iconSvg}
            </div>
            
            {/* Title & Type */}
            <div>
              <h3 className="text-[17px] font-bold text-[#0f172a] leading-tight mb-0.5">{activity.title}</h3>
              <p className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">{activity.type}</p>
            </div>
          </div>

          {/* Edit Icon */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(activity);
            }}
            className="text-[#cbd5e1] hover:text-[#94a3b8] p-1 outline-none relative z-20 transition-colors"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* Dynamic Progress Bar (Slider for numeric, standard for Yes/No) */}
        <div 
          className="w-full bg-[#f1f5f9] h-[8px] rounded-full mb-3 relative cursor-pointer group-active:cursor-ew-resize touch-pan-y"
          ref={sliderRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          {/* Active fill */}
          <motion.div 
            initial={false}
            animate={{ width: `${displayPercentage}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.2 }}
            className="absolute top-0 left-0 h-full rounded-full"
            style={{ backgroundColor: isCompleted ? '#20c997' : activity.barColor }}
          />
          
          {/* Thumb anchor (only for measurable targets) */}
          {!isBoolean && (
             <motion.div
               initial={false}
               animate={{ left: `${displayPercentage}%` }}
               transition={{ type: "spring", bounce: 0, duration: 0.2 }}
               className="absolute top-1/2 -ml-2.5 -mt-2.5 w-5 h-5 bg-white border-2 rounded-full shadow-md z-10 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
               style={{ borderColor: isCompleted ? '#20c997' : activity.barColor }}
             />
          )}

        </div>

        {/* Bottom row: Text / Hints */}
        <div className="flex items-center justify-between mt-1">
          {isCompleted ? (
            <div className="flex items-center gap-1.5 text-[#20c997] font-bold text-[14px]">
              <svg className="w-[16px] h-[16px]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Completed
            </div>
          ) : (
            <div className="text-[14px] font-bold text-[#0f172a]">
              {!isBoolean ? `${currentVal}${suffix} / ${maxVal}${suffix}` : (activity.progress || '')}
            </div>
          )}

          {!isCompleted && activity.hint && (
            <div className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-wider flex items-center gap-1 select-none">
              {!isBoolean ? 'DRAG SLIDER TO UPDATE' : activity.hint}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
};

export default ActivityCard;
