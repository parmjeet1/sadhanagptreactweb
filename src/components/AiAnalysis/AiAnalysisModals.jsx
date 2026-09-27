import React from 'react';
import AiDateFilterModal from './AiDateFilterModal';

/**
 * Shared wrapper component for backward-compatibility with screens importing AiAnalysisModals.
 */
const AiAnalysisModals = ({ isOpen, onClose, students = [], userDetails, onSuccess }) => {
  const studentIds = students.map(s => s.id || s.user_id).filter(Boolean);
  const fallbackStudents = students.length > 0 ? students : (userDetails ? [{
    id: userDetails?.user_id,
    name: userDetails?.name || 'My'
  }] : []);

  return (
    <AiDateFilterModal
      isOpen={isOpen}
      onClose={onClose}
      title="Analyze Mentees with ChatGPT"
      subtitle="Select date window for Sadhana performance analysis"
      strategy="BULK_MENTEES"
      entityParams={{
        studentIds,
        fallbackStudents,
        userId: userDetails?.user_id
      }}
      onSuccess={onSuccess}
    />
  );
};

export default AiAnalysisModals;
