// One-time reset for old corrupted data
if (localStorage.getItem('reset_done') !== 'true') {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = ''; // clear cookies
  localStorage.setItem('reset_done', 'true');
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { AuthProvider } from '@/contexts/AuthContext.jsx'; // ✅ Correct path
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
