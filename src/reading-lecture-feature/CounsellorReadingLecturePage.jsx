import React from 'react';
import { useOutletContext } from 'react-router-dom';
import CounsellorReadingLecturePageView from './CounsellorReadingLecturePageView';
import useMockStore from './useMockStore';
import useMockCounsellorTools from './useMockCounsellorTools';

/**
 * UI PREVIEW for counsellors (mock data, nothing is saved). Opened by URL only:
 * /counsellor/reading-preview. The live page with real data is CounsellorReadingLivePage (/counsellor/reading).
 */
const CounsellorReadingLecturePage = () => {
  useOutletContext();
  const store = useMockStore();
  const tools = useMockCounsellorTools();
  return <CounsellorReadingLecturePageView store={store} tools={tools} preview />;
};

export default CounsellorReadingLecturePage;
