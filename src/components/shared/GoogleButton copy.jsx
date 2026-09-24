import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postRequest } from '../../services/api';

const GoogleButton = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = React.useState(false);
    const googleButtonRef = useRef(null);

    useEffect(() => {
        const initializeGoogle = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                });

                // Render the official Google button into our container
                window.google.accounts.id.renderButton(
                    googleButtonRef.current,
                    { 
                        theme: 'outline', 
                        size: 'large', 
                        width: '340',
                        text: 'continue_with',
                        shape: 'pill'
                    }
                );
            }
        };

        const handleCredentialResponse = async (response) => {
            setIsLoading(true);
            
            postRequest('/auth/google/login', { credential: response.credential }, (data) => {
                if (data && data.user) {
                    // Store the profile data for onboarding
                    sessionStorage.setItem('user_details', JSON.stringify({
                        google_id: data.user.google_id || data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        picture: data.user.picture
                    }));
                    
                    // Set initial user details
                    // sessionStorage.setItem('user_details', JSON.stringify({}));
                    
                    // Navigate to onboarding
                    navigate("/onboarding");
                } else {
                    console.error("Login failed:", data?.message);
                }
                setIsLoading(false);
            });
        };

        // Initialize GSI
        if (window.google) {
            initializeGoogle();
        } else {
            // Wait for script to load if it hasn't yet
            const interval = setInterval(() => {
                if (window.google) {
                    clearInterval(interval);
                    initializeGoogle();
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [navigate]);

    return (
        <div className="w-full max-w-[340px] flex flex-col items-center gap-3">
            <div ref={googleButtonRef} className="w-full"></div>
            {isLoading && (
                <div className="flex items-center gap-2 text-blue-600 text-sm font-medium animate-pulse">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Processing login...
                </div>
            )}
        </div>
    );
};

export default GoogleButton;
