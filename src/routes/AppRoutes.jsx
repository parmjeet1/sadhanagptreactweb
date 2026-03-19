import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import RoleSelection from '../pages/RoleSelection';
import OnboardingStepTwo from '../pages/student/OnboardingStepTwo';
import StudentDashboard from '../pages/student/StudentDashboard';
import Analytics from '../pages/student/Analytics';
import Inspiration from '../pages/student/Inspiration';
import Profile from '../pages/student/Profile';
import AIChat from '../pages/student/AIChat';
import CounsellorDashboard from '../pages/counsellor/CounsellorDashboard';
import CounsellorProfile from '../pages/counsellor/CounsellorProfile';
import CounsellorAnalytics from '../pages/counsellor/CounsellorAnalytics';
import CounsellorRewardsManagement from '../pages/counsellor/CounsellorRewardsManagement';
import CounsellorViewMentees from '../pages/counsellor/CounsellorViewMentees';
import CounsellorAddContent from '../pages/counsellor/CounsellorAddContent';
import CounsellorAiChat from '../pages/counsellor/CounsellorAiChat';
import CounsellorGroupMentees from '../pages/counsellor/CounsellorGroupMentees';
import CounsellorStudentReport from '../pages/counsellor/CounsellorStudentReport';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<RoleSelection />} />
        <Route path="/student/onboarding-step-2" element={<OnboardingStepTwo />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/counsellor/dashboard" element={<CounsellorDashboard />} />
        <Route path="/counsellor/profile" element={<CounsellorProfile />} />
        <Route path="/counsellor/analytics" element={<CounsellorAnalytics />} />
        <Route path="/counsellor/rewards" element={<CounsellorRewardsManagement />} />
        <Route path="/counsellor/mentees" element={<CounsellorViewMentees />} />
        <Route path="/counsellor/mentee/:id" element={<CounsellorStudentReport />} />
        <Route path="/counsellor/add-content" element={<CounsellorAddContent />} />
        <Route path="/counsellor/ai-chat" element={<CounsellorAiChat />} />
        <Route path="/counsellor/group-mentees" element={<CounsellorGroupMentees />} />
        <Route path="/student/analytics" element={<Analytics />} />
        <Route path="/student/inspiration" element={<Inspiration />} />
        <Route path="/student/profile" element={<Profile />} />
        <Route path="/student/ai-chat" element={<AIChat />} />

        {/* Catch-all route to redirect back to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
