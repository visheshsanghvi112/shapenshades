import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import emailjs from '@emailjs/browser';
import { EMAILJS_PUBLIC_KEY } from './constants';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);