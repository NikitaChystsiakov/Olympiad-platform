import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: '!rounded-chip !border !border-line !bg-surface !text-fg !shadow-float !font-sans',
            description: '!text-soft',
            error: '!text-risk-high',
            success: '[&_[data-icon]]:!text-accent',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
