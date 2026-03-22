import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const userData = params.get('user');
        
        if (userData) {
            try {
                const user = JSON.parse(decodeURIComponent(userData));
                
                // Store profile in session
                sessionStorage.setItem('profile', JSON.stringify({
                    google_id: user.google_id || user.id,
                    name: user.name,
                    email: user.email,
                    picture: user.picture
                }));
                
                // Initialize empty user details
                sessionStorage.setItem('user_details', JSON.stringify({}));
                
                // Navigate to onboarding
                navigate("/onboarding");
            } catch (error) {
                console.error("Failed to parse user data from URL:", error);
                navigate("/login");
            }
        } else {
            // Check if there's an error param
            const error = params.get('error');
            if (error) {
                console.error("Auth error:", error);
            }
            navigate("/login");
        }
    }, [location, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 font-medium text-lg">Finishing login...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
