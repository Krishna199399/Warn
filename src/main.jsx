import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/outfit'
import '@fontsource-variable/syne'
import './index.css'
import App from './App.jsx'

// Remove dark mode class and clear localStorage
document.documentElement.classList.remove('dark');
localStorage.removeItem('wans-theme');

// 🔒 SECURITY: CSRF protection disabled - using JWT + CORS instead
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
