import React from 'react';
import LogoIcon from '../components/shared/LogoIcon';
import GoogleButton from '../components/shared/GoogleButton';
import FooterNote from '../components/shared/FooterNote';

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-[#f1f5f9] via-[#f8fafc] to-[#eef2f6] font-sans px-6">
      
      <LogoIcon />

      <h1 className="text-[32px] font-bold text-[#0f172a] mb-4 tracking-tight text-center">
        Hare Krishna
      </h1>

      <p className="text-[16px] text-[#64748b] text-center mb-12 font-medium">
        Track your habits, stay consistent.
      </p>

      <GoogleButton />

      <FooterNote />

    </div>
  );
};

export default Login;
