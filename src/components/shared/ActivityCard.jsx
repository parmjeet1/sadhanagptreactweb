import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { postRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';

const ActivityCard = ({ activity, onProgressUpdate, onEdit, selectedDate }) => {

  const { userDetails } = useOutletContext();
  const [isCompleted, setIsCompleted] = useState(activity.status === 'Completed');

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
    if (parts.length === 2) {
      const suffixMatch = parts[1].trim().match(/[a-zA-Z]+$/);
      return suffixMatch ? suffixMatch[0] : '';
    }
    return '';
  };

  const isBoolean = activity.type === 'YES/NO';
  const maxVal = extractMax(activity.progress);
  const initialCurrent = isCompleted ? maxVal : extractCurrent(activity.progress);
  const suffix = extractSuffix(activity.progress);

  const [currentVal, setCurrentVal] = useState(initialCurrent);

  // --- API Integrations & State for POST /add-daily-report --- //
  const [lastSavedVal, setLastSavedVal] = useState(initialCurrent);

  // Sync internal state if parent prop data changes asynchronously (e.g. from /report-as-per-date)
  useEffect(() => {
    const newMax = extractMax(activity.progress);
    const newCurrent = activity.status === 'Completed' ? newMax : extractCurrent(activity.progress);
    setCurrentVal(newCurrent);
    setIsCompleted(activity.status === 'Completed');
    setLastSavedVal(newCurrent);
  }, [activity.progress, activity.status]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentValRef = useRef(currentVal);
  useEffect(() => { currentValRef.current = currentVal; }, [currentVal]);

  const submitDailyReport = async (finalVal) => {
    // Deduplication check
    if (finalVal === lastSavedVal) return;

    try {
      setIsSubmitting(true);
      setToastMessage(null);

      // Use selected date passed from dashboard, fallback to today
      const formattedDate = selectedDate || new Date().toISOString().split('T')[0];

      let unitToSender = activity.unit || 'count';
      if (!activity.unit) {
        if (activity.type === 'COUNT') unitToSender = 'rounds';
        if (activity.type === 'DURATION') unitToSender = 'min';
        if (activity.type === 'TIME') unitToSender = 'time';
      }

      const payload = {
        activity_id: activity.id,
        count: finalVal,
        activity_date: formattedDate,

        user_id: userDetails.user_id
      };


      const response = await new Promise((resolve) => {
        postRequest('/add-daily-report', payload, resolve);
      });

      const { message, type } = processResponse(response?.data);

      if (type === 'success') {
        setLastSavedVal(finalVal);
        setToastMessage({ type: 'success', text: 'Saved!' });

        if (onProgressUpdate) {
          const isComplete = finalVal >= maxVal;
          let newProgressStr = `${finalVal}${suffix || ''} / ${maxVal}${suffix || ''}`;
          if (activity?.type === 'YES/NO' || activity?.type === 'boolean' || activity?.type === 'TIME') {
            newProgressStr = '';
          }
          onProgressUpdate(activity?.id, {
            progress: newProgressStr,
            status: isComplete ? 'Completed' : 'Pending',
            target: maxVal
          });
        }
      } else {
        throw new Error(message || 'API Default Error');
      }

    } catch (err) {
      console.error("Failed to save report:", err);
      setToastMessage({ type: 'error', text: 'Error!' });

      // Revert UI to the last successfully saved value
      setCurrentVal(lastSavedVal);
      const revertedCompleted = lastSavedVal >= maxVal;
      setIsCompleted(revertedCompleted);

      if (onProgressUpdate) {
        onProgressUpdate(activity.id, {
          progress: `${lastSavedVal}${suffix} / ${maxVal}${suffix}`,
          status: revertedCompleted ? 'Completed' : 'Pending'
        });
      }
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMessage(null), 2500); // Clear toast after a while
    }
  };

  // --- Animation and Drag logic for Slider (COUNT/TIME/DURATION) --- //
  const sliderRef = useRef(null);
  const [sliderWidth, setSliderWidth] = useState(0);

  useEffect(() => {
    if (sliderRef.current) {
      setSliderWidth(sliderRef.current.offsetWidth);
    }
  }, []);

  const handlePointerDown = (e) => {
    if (isBoolean) return;
    setIsDragging(true);
    updateScrubber(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (isBoolean || !isDragging) return;
    updateScrubber(e.clientX);
  };

  const handlePointerUpOrLeave = () => {
    if (isBoolean || !isDragging) return;
    setIsDragging(false);
    submitDailyReport(currentValRef.current);
  };

  const updateScrubber = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;

    let newVal = Math.round(percentage * maxVal);
    currentValRef.current = newVal; // Sync immediately to prevent pointerUp race condition
    setCurrentVal(newVal);

    if (newVal >= maxVal && !isCompleted) {
      setIsCompleted(true);
    } else if (newVal < maxVal && isCompleted) {
      setIsCompleted(false);
    }
  };

  // --- Logic for Full Swipe (YES/NO) & Edit options --- //
  const cardControls = useAnimation();
  const cardX = useMotionValue(0);
  const background = useTransform(cardX, [-80, 0, 80], ['#fee2e2', '#ffffff', '#dcfce7']);

  const handleCardDragEnd = (event, info) => {
    const swipeRightThreshold = 100;
    const swipeLeftThreshold = -80;

    if (info.offset.x > swipeRightThreshold) {
      if (isBoolean && !isCompleted) {
        setIsCompleted(true);
        if (onProgressUpdate) onProgressUpdate(activity.id, { status: 'Completed' });
        submitDailyReport(1);
      }
    } else if (info.offset.x < swipeLeftThreshold) {
      if (isBoolean && isCompleted) {
        setIsCompleted(false);
        if (onProgressUpdate) onProgressUpdate(activity.id, { status: 'Pending' });
        submitDailyReport(0);
      } else {
        console.log("Opened edit/delete for", activity.title);
      }
    }

    cardControls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
  };

  let displayPercentage = isCompleted ? 100 : (maxVal > 0 ? (currentVal / maxVal) * 100 : 0);
  if (isBoolean && !isCompleted) displayPercentage = 0;
  if (isBoolean && isCompleted) displayPercentage = 100;

  return (
    <div className="relative w-full max-w-md mx-auto mb-4 rounded-2xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100 bg-white group">
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
            <div className={`w-12 h-12 rounded-full flex items-center justify-center`} style={{ backgroundColor: activity?.iconBgColor || '#f1f5f9', color: activity?.iconColor || '#64748b' }}>
              {activity?.iconSvg}
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#0f172a] leading-tight mb-0.5">{activity?.title || 'Activity'}</h3>
              <p className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider">{activity?.type || 'Other'}</p>
            </div>
          </div>

          <div className="relative flex items-center h-[26px]">
            {isSubmitting ? (
              <div className="w-[18px] h-[18px] border-[2px] border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
            ) : toastMessage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${toastMessage.type === 'success' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'}`}
              >
                {toastMessage.text}
              </motion.div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(activity);
                }}
                className="text-[#cbd5e1] hover:text-[#94a3b8] outline-none relative z-20 transition-colors flex items-center justify-center p-1"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div
          className="w-full bg-[#f1f5f9] h-[8px] rounded-full mb-3 relative cursor-pointer group-active:cursor-ew-resize touch-pan-y"
          ref={sliderRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrLeave}
          onPointerLeave={handlePointerUpOrLeave}
          onPointerCancel={handlePointerUpOrLeave}
        >
            <motion.div
            initial={false}
            animate={{ width: `${displayPercentage}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.2 }}
            className="absolute top-0 left-0 h-full rounded-full"
            style={{ backgroundColor: isCompleted ? '#20c997' : (activity?.barColor || '#1a73e8') }}
          />
          {!isBoolean && (
            <motion.div
              initial={false}
              animate={{ left: `${displayPercentage}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.2 }}
              className="absolute top-1/2 -ml-2.5 -mt-2.5 w-5 h-5 bg-white border-2 rounded-full shadow-md z-10 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
              style={{ borderColor: isCompleted ? '#20c997' : (activity?.barColor || '#1a73e8') }}
            />
          )}
        </div>

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
