import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../contexts/WalletContext.jsx'; 
import mainLogo from '../assets/americaparty-logo.png';
import './MintPage.css';

// --- Configuration ---
const badgeMinterAddress = import.meta.env.VITE_BADGE_MINTER_ADDRESS;
const usdcAddress = import.meta.env.VITE_USDC_ADDRESS;
const governorAddress = import.meta.env.VITE_GOVERNOR_CONTRACT_ADDRESS;
const publicRpcUrl = import.meta.env.VITE_PUBLIC_POLYGON_RPC_URL;

// --- ABIs ---
import BadgeMinterABI from '../abis/BadgeMinter.json';
import GovernorABI from '../abis/GovernorAlphaParty.json';
import ERC20ABI from '../config/abis/ERC20.json'; 

function MintPage() {
    const { signer, account, chainId, connectWallet } = useContext(WalletContext);

    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState("Connect your wallet to begin.");
    const [mintedCount, setMintedCount] = useState(0);
    const [totalSupply] = useState(10000);
    const [currentPrice, setCurrentPrice] = useState("...");
    const [treasuryBalance, setTreasuryBalance] = useState("...");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const readOnlyProvider = new ethers.JsonRpcProvider(publicRpcUrl);
                const minterContract = new ethers.Contract(badgeMinterAddress, BadgeMinterABI.abi, readOnlyProvider);
                const usdcContract = new ethers.Contract(usdcAddress, ERC20ABI, readOnlyProvider);

                const count = await minterContract.totalMinted();
                setMintedCount(Number(count));

                const treasuryAddr = await minterContract.treasuryWallet();
                const balance = await usdcContract.balanceOf(treasuryAddr); 
                setTreasuryBalance(parseFloat(ethers.formatUnits(balance, 6)).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }));

                if (Number(count) < totalSupply) {
                    const priceData = await minterContract.getPriceForQuantity(count, 1);
                    setCurrentPrice(ethers.formatUnits(priceData.totalPrice, 6));
                } else {
                    setCurrentPrice("N/A");
                }
            } catch (e) {
                console.error("Data fetch error:", e);
                setFeedback("Could not load data. Verify contract addresses in .env and restart server.");
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []); // Keep the dependency array EMPTY.

    // --- handlePurchase logic ---
    const handlePurchase = async () => {
        if (!signer) { setFeedback("Please connect your wallet first."); return; }
        if (chainId !== 137) { setFeedback("Error: Please switch to the Polygon Mainnet."); return; }
        setIsLoading(true);
        setFeedback("Step 1: Preparing transaction...");
        try {
            const minterContract = new ethers.Contract(badgeMinterAddress, BadgeMinterABI.abi, signer);
            const usdcContract = new ethers.Contract(usdcAddress, ERC20ABI, signer);
            const priceData = await minterContract.getPriceForQuantity(mintedCount, 1);
            const totalPrice = priceData.totalPrice;
            setFeedback(`Step 2: Requesting approval to spend ${currentPrice} USDC...`);
            const approveTx = await usdcContract.approve(badgeMinterAddress, totalPrice);
            setFeedback("Step 3: Waiting for approval confirmation...");
            await approveTx.wait();
            setFeedback("Step 4: Securing your Founder's Badge...");
            const purchaseTx = await minterContract.purchaseBadges(1);
            setFeedback("Step 5: Finalizing on the blockchain...");
            await purchaseTx.wait();
            setFeedback("🎉 Success! Your Founder's Badge is yours! Welcome.");
            const newCount = await minterContract.totalMinted();
            setMintedCount(Number(newCount));
        } catch (error) {
            console.error("Purchase failed:", error);
            const errorMessage = error.reason || error.data?.message || "Transaction failed.";
            setFeedback(`Error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // ... JSX from before is correct ...
    const isSoldOut = mintedCount >= totalSupply;
    const TALLY_PROPOSE_URL = `https://www.tally.xyz/gov/${governorAddress}/propose`;
    const TALLY_VOTE_URL = `https://www.tally.xyz/gov/${governorAddress}`;
    
    return (
        <div className="page-grid">
            <div className="left-column">
                <img src={mainLogo} alt="America Party" className="main-logo" />
                <div className="mint-card colorful-card">
                    <h1>The First 10,000.</h1>
                    <p className="subtitle">Become a Founding Member of the America Party. Secure one of only 10,000 governance badges ever to be created.</p>
                    <div className="supply-counter">
                        <div className="supply-text"><span>FOUNDERS' BADGES CLAIMED</span><span>{mintedCount.toLocaleString()} / {totalSupply.toLocaleString()}</span></div>
                        <div className="progress-bar-background"><div className="progress-bar-foreground" style={{ width: `${(mintedCount / totalSupply) * 100}%` }}></div></div>
                    </div>
                    <div className="mint-action-area">
                        {account ? (
                            <button className="mint-button" onClick={handlePurchase} disabled={isLoading || isSoldOut}>{isLoading ? "Processing..." : isSoldOut ? "SOLD OUT" : `Secure My Badge (${currentPrice} USDC)`}</button>
                        ) : (
                            <button className="mint-button" onClick={connectWallet}>Connect Wallet</button>
                        )}
                    </div>
                    {feedback && <p className="feedback-text">{feedback}</p>}
                </div>
            </div>
            <div className="right-column">
                <div className="dashboard-module colorful-card stats-module">
                    <h2>DAO Stats</h2>
                    <div className="stats-grid"><div className="stat-item"><span>👥</span><div className="stat-text-content"><span className="stat-value">{mintedCount.toLocaleString()}</span><span className="stat-label">Total Founders</span></div></div><div className="stat-item"><span>💰</span><div className="stat-text-content"><span className="stat-value">{treasuryBalance}</span><span className="stat-label">DAO Treasury</span></div></div></div>
                </div>
                <div className="dashboard-module colorful-card proposals-module">
                    <h2>Recent Proposals</h2>
                    <div className="proposal-list-container"><p className="proposal-item-empty">The floor is open. The first proposal can now be made.</p></div>
                    <a href={TALLY_VOTE_URL} target="_blank" rel="noopener noreferrer" className="view-all-link">Vote on Proposals →</a>
                </div>
                <div className="dashboard-module colorful-card cta-module">
                    <h2>Shape the Future</h2>
                    <p className="cta-text">As a Founder, you have the power to create proposals and define the direction of the party. Make your voice heard.</p>
                    <a href={TALLY_PROPOSE_URL} target="_blank" rel="noopener noreferrer" className="cta-button">Create Your First Proposal</a>
                </div>
                <div className="dashboard-module colorful-card community-module">
                    <h2>Join The Conversation</h2>
                    <a href="https://twitter.com/SimoUzel" target="_blank" rel="noopener noreferrer" className="primary-social-link">Follow @SimoUzel on X</a>
                </div>
            </div>
        </div>
    );
}

export default MintPage;