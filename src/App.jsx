// frontend/src/App.jsx
import React from 'react';

// Correct paths from src/ to its subdirectories
import { WalletProvider } from './providers/WalletProvider.jsx';
import MintPage from './pages/MintPage.jsx';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <MintPage />
    </WalletProvider>
  );
}

export default App;


