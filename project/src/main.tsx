import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';  // Fixed import
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);