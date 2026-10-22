import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ReadingLecturePageView from './ReadingLecturePageView';
import useReadingLectureStore from './useReadingLectureStore';

/** The student's Reading & Lectures page with REAL data. Opened by URL only for now: /student/reading */
const ReadingLectureLivePage = () => {
  useOutletContext();
  const store = useReadingLectureStore();
  return <ReadingLecturePageView store={store} />;
};

export default ReadingLectureLivePage;
