import React from 'react';
import useReadingLectureStore from '../useReadingLectureStore';
import useCounsellorTools from '../useCounsellorTools';
import { StudentArea, CounsellorArea } from './Areas';

/** Real (server) versions of the areas, for use inside the Inspiration pages. */
export const LiveStudentArea = ({ section }) => <StudentArea store={useReadingLectureStore()} section={section} />;

export const LiveCounsellorArea = ({ section }) => (
  <CounsellorArea store={useReadingLectureStore()} tools={useCounsellorTools()} section={section} />
);
