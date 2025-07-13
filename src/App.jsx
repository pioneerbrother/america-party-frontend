// frontend/src/App.jsx
import React from 'react';

// Correct paths from src/ to its subdirectories
import { WalletProvider } from './providers/WalletProvider.jsx';
import HomePage from './pages/HomePage';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <HomePage />
    </WalletProvider>
  );
}

export default App;


