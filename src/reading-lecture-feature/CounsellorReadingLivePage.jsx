import React from 'react';
import { useOutletContext } from 'react-router-dom';
import CounsellorReadingLecturePageView from './CounsellorReadingLecturePageView';
import useReadingLectureStore from './useReadingLectureStore';
import useCounsellorTools from './useCounsellorTools';

/** The counsellor's Reading & Lectures page with REAL data. Opened by URL only for now: /counsellor/reading */
const CounsellorReadingLivePage = () => {
  useOutletContext();
  const store = useReadingLectureStore();
  const tools = useCounsellorTools();
  return <CounsellorReadingLecturePageView store={store} tools={tools} />;
};

export default CounsellorReadingLivePage;
