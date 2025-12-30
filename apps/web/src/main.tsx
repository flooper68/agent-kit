import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TRPCProvider } from './providers/TRPCProvider';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TRPCProvider>
      <App />
    </TRPCProvider>
  </React.StrictMode>
);
