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

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<RoleSelection />} />
        <Route path="/onboarding-step-2" element={<OnboardingStepTwo />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/counsellor-dashboard" element={<CounsellorDashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/inspiration" element={<Inspiration />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ai-chat" element={<AIChat />} />

        {/* Catch-all route to redirect back to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
