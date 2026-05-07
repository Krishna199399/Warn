import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeCsrf } from './api/client'

// Remove dark mode class and clear localStorage
document.documentElement.classList.remove('dark');
localStorage.removeItem('wans-theme');

// 🔒 SECURITY: Initialize CSRF token before rendering app
initializeCsrf().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
