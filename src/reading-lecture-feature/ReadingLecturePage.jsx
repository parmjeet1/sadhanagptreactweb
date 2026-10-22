import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ReadingLecturePageView from './ReadingLecturePageView';
import useMockStore from './useMockStore';

/**
 * UI PREVIEW (mock data, nothing is saved). Opened by URL only: /student/reading-preview
 * The live page with real data is ReadingLectureLivePage (/student/reading).
 */
const ReadingLecturePage = () => {
  useOutletContext();
  const store = useMockStore();
  return <ReadingLecturePageView store={store} preview />;
};

export default ReadingLecturePage;
