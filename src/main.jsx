// Main entry point for Solora StayCo (React)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { testFirebaseConnection, displayTestResults } from './firebase/testConnection.js';

// Test Firebase connection on app initialization
testFirebaseConnection().then(results => {
  displayTestResults(results);
});

// Render React app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

