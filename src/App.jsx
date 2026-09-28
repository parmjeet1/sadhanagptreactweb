import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <AppRoutes />
    </>
  );
}

export default App;
