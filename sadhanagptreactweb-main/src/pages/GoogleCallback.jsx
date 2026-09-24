import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const dataParam = params.get('data');
        const userParam = params.get('user');

        const rawData = dataParam || userParam;

        if (rawData) {
            try {
                const decodedData = JSON.parse(decodeURIComponent(rawData));
                const user = decodedData.user || decodedData;

                // Store all profile and auth data in localStorage
                localStorage.setItem('user_details', JSON.stringify({
                    ...user, // Merge all fields from backend (user_id, access_token, user_type, etc.)
                    google_id: user.google_id || user.id || user.sub,
                    name: user.name || user.displayName,
                    email: user.email,
                    picture: user.picture || user.avatar_url
                }));

                // Navigate based on user status/registration
                if (user.status === 'existing_user' && user.user_type) {
                    navigate(`/${user.user_type}/dashboard`);
                } else if (user.user_type === 'student' || user.user_type === 'counsellor') {
                    // If we already know the type but they aren't marked as "existing", maybe continue onboarding
                    navigate("/onboarding");
                } else {
                    // Default fallback
                    navigate("/onboarding");
                }
            } catch (error) {
                console.error("Failed to parse user data from URL:", error);
                navigate("/");
            }
        } else {
            // Check if there's an error param
            const error = params.get('error');
            if (error) {
                console.error("Auth error:", error);
            }
            navigate("/");
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
