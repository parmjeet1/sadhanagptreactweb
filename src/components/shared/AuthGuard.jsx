import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AuthGuard = () => {
  const userDetailsStr = localStorage.getItem('user_details');
  const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : null;

  // Check if at least user_id and access_token exist as requested
  const isAuthenticated = userDetails && userDetails.user_id && userDetails.access_token;

  if (!isAuthenticated) {
    // Log out: Clear potential partial data
    // localStorage.removeItem('user_details');
    // Redirect to root /
    return <Navigate to="/" replace />;
  }

  // If authenticated, pass the securely parsed user details natively through all child routes
  return <Outlet context={{ userDetails }} />;
};

export default AuthGuard;
