// frontend/src/providers/WalletProvider.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';

// Correct path from 'src/providers' up to 'src' and down to 'contexts'
import { WalletContext } from '../contexts/WalletContext.jsx';

export function WalletProvider({ children }) {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);

    const connectWallet = useCallback(async () => {
        if (window.ethereum) {
            try {
                const web3Provider = new ethers.BrowserProvider(window.ethereum);
                await web3Provider.send("eth_requestAccounts", []);
                const web3Signer = await web3Provider.getSigner();
                const userAddress = await web3Signer.getAddress();
                const network = await web3Provider.getNetwork();

                setProvider(web3Provider);
                setSigner(web3Signer);
                setAccount(userAddress);
                setChainId(Number(network.chainId));
                console.log("WalletProvider: Successfully connected.");
            } catch (error) {
                console.error("WalletProvider: Error connecting wallet.", error);
            }
        } else {
            console.error("WalletProvider: MetaMask not found.");
        }
    }, []);

    const disconnectWallet = useCallback(() => {
        setProvider(null);
        setSigner(null);
        setAccount(null);
        setChainId(null);
    }, []);

    const contextValue = useMemo(() => ({
        provider, signer, account, chainId, connectWallet, disconnectWallet
    }), [provider, signer, account, chainId, connectWallet, disconnectWallet]);

    return (
        <WalletContext.Provider value={contextValue}>
            {children}
        </WalletContext.Provider>
    );
}
